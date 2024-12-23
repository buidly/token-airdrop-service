import { CommonConfigService } from '@libs/common';
import { AirdropRepository } from '@libs/database';
import { Airdrop } from '@libs/entities';
import {
  AbiRegistry,
  Address,
  AddressValue,
  BigUIntValue,
  SmartContract,
  Token,
  TokenTransfer,
  Transaction,
  TransferTransactionsFactory,
} from '@multiversx/sdk-core/out';
import { Mnemonic, UserSigner } from '@multiversx/sdk-wallet/out';
import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as xBulkContractAbi from '../constants/xbulk.abi.json';
import BigNumber from 'bignumber.js';

const csvBatch = require('csv-batch');

@Injectable()
export class AirdropService {
  private readonly logger: Logger;
  private readonly xBulkContract: SmartContract;

  constructor(
    private readonly airdropRepository: AirdropRepository,
    private readonly commonConfigService: CommonConfigService,
  ) {
    this.logger = new Logger(AirdropService.name);
    const abiRegistry = AbiRegistry.create(xBulkContractAbi);
    this.xBulkContract = new SmartContract({
      address: new Address(this.commonConfigService.config.xBulkAddress),
      abi: abiRegistry,
    });
  }

  async createMany(
    records: Array<{ address: string; amount: string }>,
  ): Promise<Airdrop[] | null> {
    try {
      const result = await this.airdropRepository.createMany(records);

      return result;
    } catch (error) {
      console.error('Error processing batch:', error);
      throw error;
    }
  }

  async findBatchWithoutTxHash(batchSize: number): Promise<Airdrop[]> {
    return await this.airdropRepository.findBatchWithoutTxHash(batchSize);
  }

  async addTransaction(
    address: string,
    txHash: string,
  ): Promise<Airdrop | null> {
    return await this.airdropRepository.addTransaction(address, txHash);
  }

  async countPendingAirdrops(): Promise<number> {
    return await this.airdropRepository.countPendingAirdrops();
  }

  async countUnprocessedAirdrops(): Promise<number> {
    return await this.airdropRepository.countUnprocessedAirdrops();
  }

  async addTransactions(
    updates: Array<{ address: string; txHash: string }>,
  ): Promise<void> {
    return await this.airdropRepository.addTransactions(updates);
  }

  async executeTransaction(txHash: string): Promise<Airdrop[] | null> {
    return await this.airdropRepository.executeTransaction(txHash);
  }

  async cleanupOldTransactions(): Promise<void> {
    return await this.airdropRepository.cleanupOldTransactions();
  }

  async cleanupInvalidAddresses(): Promise<void> {
    return await this.airdropRepository.cleanupInvalidAddresses();
  }

  async processAirdropCsv(): Promise<void> {
    this.logger.debug('Started processing CSV file');
    const filePath = path.join(
      process.cwd(),
      'libs',
      'services',
      'src',
      'constants',
      'airdrop.csv',
    );

    const fileStream = fs.createReadStream(filePath);

    await csvBatch(fileStream, {
      batch: true,
      batchSize: 10000,
      batchExecution: async (batch: { address: string; amount: string }[]) =>
        await this.createMany(batch),
    }).then((results: { totalRecords: any }) => {
      this.logger.debug(`Processed ${results.totalRecords}`);
    });

    this.logger.debug('CSV file processed with success.');
  }

  async getAccountNonce(address: string): Promise<number | undefined> {
    const nonce = await axios
      .get(`${this.commonConfigService.config.urls.api}/accounts/${address}`)
      .then((res) => res.data.nonce);
    return nonce;
  }

  createTransaction(
    factory: TransferTransactionsFactory,
    amount: string,
    address: string,
    senderAddress: string,
    chainId: string,
    nonce: number,
  ): Transaction {
    const payment = TokenTransfer.fungibleFromAmount(
      this.commonConfigService.config.tokenIdentifier,
      amount,
      parseInt(this.commonConfigService.config.tokenDecimals),
    );

    const transaction = factory.createTransactionForESDTTokenTransfer({
      sender: new Address(senderAddress),
      receiver: new Address(address),
      tokenTransfers: [payment],
    });
    transaction.nonce = BigInt(nonce || 0);
    transaction.chainID = chainId;
    transaction.value = BigInt(0);

    return transaction;
  }

  bulkSendTokens(
    senderAddress: string,
    chainId: string,
    airdrops: Array<Airdrop>,
    nonce: number,
  ): Transaction {
    const baseGasPerAddress = 800000;
    const endpointArgs: any[] | undefined = [];

    const totalAmount = airdrops.reduce(
      (sum, { amount }) => sum.plus(new BigNumber(amount)),
      new BigNumber(0),
    );

    const payment = new TokenTransfer({
      token: new Token({
        identifier: this.commonConfigService.config.tokenIdentifier,
      }),
      amount: BigInt(totalAmount.toFixed()),
    });

    airdrops.forEach(({ address, amount }) => {
      endpointArgs.push([
        new AddressValue(Address.fromBech32(address)),
        new BigUIntValue(new BigNumber(amount).toString()),
      ]);
    });

    const transaction = this.xBulkContract.methods
      .bulksend(endpointArgs)
      .withMultiESDTNFTTransfer([payment])
      .withSender(Address.fromBech32(senderAddress))
      .withChainID(chainId)
      .withGasLimit(baseGasPerAddress * airdrops.length)
      .withNonce(nonce)
      .buildTransaction();

    return transaction;
  }

  public async processAirdrops(): Promise<void> {
    this.logger.debug('Starting the airdrop processing...');

    const chainId =
      this.commonConfigService.config.network.toString() === 'devnet'
        ? 'D'
        : '1';
    const mnemonic = Mnemonic.fromString(
      this.commonConfigService.config.mnemonics.first,
    ).deriveKey(0);
    const signer = new UserSigner(mnemonic);
    const senderAddress = signer.getAddress().bech32();

    const batchSize = 10000;
    const groupSize = 100;

    let nonce = (await this.getAccountNonce(senderAddress)) ?? 0;
    const airdrops = await this.findBatchWithoutTxHash(batchSize);
    this.logger.debug(`Found ${airdrops.length} airdrops to process.`);

    const txBatch: any[] = [];
    const batchUpdates: Array<{ address: string; txHash: string }> = [];

    for (let i = 0; i < airdrops.length; i += groupSize) {
      const group = airdrops.slice(i, i + groupSize);
      if (group.length === 0) continue;

      try {
        const tx = this.bulkSendTokens(senderAddress, chainId, group, nonce);

        const signature = await signer.sign(tx.serializeForSigning());
        tx.applySignature(signature);

        const txHash = tx.getHash().toString();
        txBatch.push(tx.toSendable());

        group.forEach(({ address }) => {
          batchUpdates.push({ address, txHash });
        });

        nonce++;
      } catch (error) {
        this.logger.error(
          `Failed to prepare transaction for group starting at index ${i}`,
          error,
        );
      }
    }

    if (txBatch.length > 0) {
      this.logger.debug(
        `Submitting ${txBatch.length} transactions to the gateway...`,
      );

      try {
        await this.addTransactions(batchUpdates);

        for (let i = 0; i < txBatch.length; i++) {
          await axios.post(
            `${this.commonConfigService.config.urls.gateway}/transaction/send`,
            txBatch[i],
          );
        }
        this.logger.debug('All transactions submitted successfully.');
      } catch (error) {
        this.logger.error('Failed during batch processing:', error);
      }
    } else {
      this.logger.debug('No transactions were prepared for submission.');
    }

    this.logger.debug('Airdrop processing completed.');
  }
}

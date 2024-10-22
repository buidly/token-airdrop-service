import { CommonConfigService } from '@libs/common';
import { AirdropRepository } from '@libs/database';
import { Airdrop } from '@libs/entities';
import {
  Address,
  TokenTransfer,
  Transaction,
  TransactionsFactoryConfig,
  TransferTransactionsFactory,
} from '@multiversx/sdk-core/out';
import { Mnemonic, UserSigner } from '@multiversx/sdk-wallet/out';
import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

const csvBatch = require('csv-batch');

@Injectable()
export class AirdropService {
  constructor(
    private readonly airdropRepository: AirdropRepository,
    private readonly commonConfigService: CommonConfigService,
  ) {}

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

  async addTransactions(
    updates: Array<{ address: string; txHash: string }>,
  ): Promise<void> {
    return await this.airdropRepository.addTransactions(updates);
  }

  async executeTransaction(txHash: string): Promise<Airdrop | null> {
    return await this.airdropRepository.executeTransaction(txHash);
  }

  async cleanupOldTransactions(): Promise<void> {
    return await this.airdropRepository.cleanupOldTransactions();
  }

  async processAirdropCsv(): Promise<void> {
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
      console.log(`Processed ${results.totalRecords}`);
    });

    console.log('CSV file processed with success.');
  }

  async getAccountNonce(address: string): Promise<number | undefined> {
    const nonce = await axios
      .get(`${this.commonConfigService.config.urls.api}/accounts/${address}`)
      .then((res) => res.data.nonce);
    return nonce;
  }

  async sendTransaction(transaction: Transaction): Promise<any> {
    const response = await axios.post(
      `${this.commonConfigService.config.urls.api}/transactions`,
      transaction.toSendable(),
    );
    return response;
  }

  async createTransaction(
    factory: TransferTransactionsFactory,
    signer: UserSigner,
    amount: string,
    address: string,
    senderAddress: string,
    chainId: string,
    nonce: number,
  ): Promise<Transaction> {
    const payment = TokenTransfer.fungibleFromAmount(
      this.commonConfigService.config.tokens.first,
      amount,
      18,
    );

    const transaction = factory.createTransactionForESDTTokenTransfer({
      sender: new Address(senderAddress),
      receiver: new Address(address),
      tokenTransfers: [payment],
    });
    transaction.nonce = BigInt(nonce || 0);
    transaction.chainID = chainId;
    transaction.value = BigInt(0);

    const signature = await signer.sign(transaction.serializeForSigning());
    transaction.applySignature(signature);

    return transaction;
  }

  public async processAirdrops(): Promise<void> {
    const chainId =
      this.commonConfigService.config.network.toString() === 'devnet'
        ? 'D'
        : '1';
    const factoryConfig = new TransactionsFactoryConfig({
      chainID: chainId,
    });
    const factory = new TransferTransactionsFactory({ config: factoryConfig });
    const mnemonic = Mnemonic.fromString(
      this.commonConfigService.config.mnemonics.first,
    ).deriveKey(0);
    const signer = new UserSigner(mnemonic);
    const senderAddress = signer.getAddress().bech32();

    const batchSize = 10000;

    let hasMoreRecords = true;
    let nonce = (await this.getAccountNonce(senderAddress)) ?? 0;

    while (hasMoreRecords) {
      const airdrops = await this.findBatchWithoutTxHash(batchSize);

      if (airdrops.length === 0) {
        hasMoreRecords = false;
        continue;
      }

      const txBatch = [];
      const batchUpdates: Array<{ address: string; txHash: string }> = [];

      for (const airdrop of airdrops) {
        try {
          const { address, amount } = airdrop;
          const transaction = await this.createTransaction(
            factory,
            signer,
            amount,
            address,
            senderAddress,
            chainId,
            nonce,
          );

          const txHash = transaction.getHash().toString();
          txBatch.push(transaction.toSendable());
          batchUpdates.push({ address, txHash });

          console.log(
            `Successfully sent ${amount} tokens to ${address} with txHash ${txHash}`,
          );

          nonce += 1;
        } catch (error) {
          console.error(`Failed to send tokens to ${airdrop.address}`);
        }
      }

      if (batchUpdates.length > 0) {
        try {
          await this.addTransactions(batchUpdates);
          console.log(
            `Updated database with ${batchUpdates.length} transaction hashes`,
          );

          await axios.post(
            `${this.commonConfigService.config.urls.gateway}/transaction/send-multiple`,
            txBatch,
          );
        } catch (error) {
          console.error('Failed during batch processing:', error);
        }
      }
    }

    console.log('Airdrop processing completed.');
  }
}

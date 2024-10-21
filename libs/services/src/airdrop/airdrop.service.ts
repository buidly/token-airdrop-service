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
import { parse } from 'csv-parse';
import { createReadStream } from 'fs';
import * as path from 'path';

@Injectable()
export class AirdropService {
  constructor(
    private readonly airdropRepository: AirdropRepository,
    private readonly commonConfigService: CommonConfigService,
  ) {}

  async create(address: string, amount: string): Promise<Airdrop | null> {
    return await this.airdropRepository.create(address, amount);
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

    const parser = createReadStream(filePath).pipe(
      parse({
        columns: true,
        skip_empty_lines: true,
      }),
    );

    for await (const record of parser) {
      await this.create(record.address, record.amount);
    }

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

  public async processAirdrops(): Promise<void> {
    const chainId =
      this.commonConfigService.config.network.toString() === 'devnet'
        ? 'D'
        : '1';
    const factoryConfig = new TransactionsFactoryConfig({
      chainID: chainId,
    });
    const factory = new TransferTransactionsFactory({ config: factoryConfig });
    const batchSize = 50;
    const mnemonic = Mnemonic.fromString(
      this.commonConfigService.config.mnemonics.first,
    ).deriveKey(0);
    const signer = new UserSigner(mnemonic);
    const senderAddress = signer.getAddress().bech32();

    let hasMoreRecords = true;
    let nonce = (await this.getAccountNonce(senderAddress)) ?? 0;

    while (hasMoreRecords) {
      const airdrops = await this.findBatchWithoutTxHash(batchSize);

      if (airdrops.length === 0) {
        hasMoreRecords = false;
        continue;
      }

      for (const airdrop of airdrops) {
        try {
          const { address, amount } = airdrop;

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

          const signature = await signer.sign(
            transaction.serializeForSigning(),
          );
          transaction.applySignature(signature);

          const response = await axios.post(
            `${this.commonConfigService.config.urls.api}/transactions`,
            transaction.toSendable(),
          );
          const { txHash } = response.data;
          await this.addTransaction(address, txHash);

          console.log(
            `Successfully sent ${amount} tokens to ${address} with txHash ${txHash}`,
          );

          nonce += 1;
        } catch (error) {
          console.error(`Failed to send tokens to ${airdrop.address}`);
        }
      }
    }

    console.log('Airdrop processing completed.');
  }
}

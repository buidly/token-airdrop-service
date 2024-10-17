import { CommonConfigModule, CommonConfigService } from '@libs/common';
import { Airdrop, AirdropSchema } from '@libs/entities';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AirdropRepository } from './repositories';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [CommonConfigModule],
      useFactory: (configService: CommonConfigService) => ({
        uri: `mongodb://${configService.config.database.host}:${configService.config.database.port}`,
        dbName: configService.config.database.name,
        user: configService.config.database.username,
        pass: configService.config.database.password,
        tlsAllowInvalidCertificates:
          configService.config.database.tlsAllowInvalidCertificates,
      }),
      inject: [CommonConfigService],
    }),
    MongooseModule.forFeature([{ name: Airdrop.name, schema: AirdropSchema }]),
  ],
  providers: [AirdropRepository],
  exports: [AirdropRepository],
})
export class DatabaseModule {}

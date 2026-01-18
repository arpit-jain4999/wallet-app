import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WalletController } from './wallet.controller';
import { WalletService } from './services/wallet.service';
import { TransactionService } from './services/transaction.service';
import { ExportService } from './services/export.service';
import { WalletRepository } from './repositories/wallet.repository';
import { TransactionRepository } from './repositories/transaction.repository';
import { ExportJobRepository } from './repositories/export-job.repository';
import { Wallet, WalletSchema } from './schemas/wallet.schema';
import { Transaction, TransactionSchema } from './schemas/transaction.schema';
import { ExportJob, ExportJobSchema } from './schemas/export-job.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Wallet.name, schema: WalletSchema },
      { name: Transaction.name, schema: TransactionSchema },
      { name: ExportJob.name, schema: ExportJobSchema },
    ]),
  ],
  controllers: [WalletController],
  providers: [
    WalletService,
    TransactionService,
    ExportService,
    // Provide concrete implementations with interface tokens
    {
      provide: 'IWalletRepository',
      useClass: WalletRepository,
    },
    {
      provide: 'ITransactionRepository',
      useClass: TransactionRepository,
    },
    ExportJobRepository,
  ],
})
export class WalletModule {}

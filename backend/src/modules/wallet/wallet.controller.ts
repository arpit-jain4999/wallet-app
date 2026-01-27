import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { FastifyReply } from 'fastify';
import { WalletService } from './services/wallet.service';
import { TransactionService } from './services/transaction.service';
import { ExportService } from './services/export.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { TransactionDto } from './dto/transaction.dto';
import { generateCSV } from '../../common/utils/csv.util';
import { normalizePagination } from '../../common/utils/pagination.util';

@ApiTags('Wallet')
@Controller()
export class WalletController {
  constructor(
    private readonly walletService: WalletService,
    private readonly transactionService: TransactionService,
    private readonly exportService: ExportService,
  ) {}

  @Post('setup')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Initialize a new wallet' })
  @ApiBody({ type: CreateWalletDto })
  @ApiResponse({
    status: 200,
    description: 'Wallet created successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: '4349349843' },
        balance: { type: 'number', example: 20 },
        name: { type: 'string', example: 'Hello world' },
        date: { type: 'string', format: 'date-time' },
        transactionId: { type: 'string', example: '4349349843' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async setup(@Body() createWalletDto: CreateWalletDto) {
    return this.walletService.setupWallet(
      createWalletDto.name,
      createWalletDto.balance,
    );
  }

  @Get('wallet/:id')
  @ApiOperation({ summary: 'Get wallet details by ID' })
  @ApiParam({ name: 'id', description: 'Wallet ID', example: '4349349843' })
  @ApiResponse({
    status: 200,
    description: 'Wallet details',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: '4349349843' },
        balance: { type: 'number', example: 20.5612 },
        name: { type: 'string', example: 'Hello world' },
        date: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Wallet not found' })
  async getWallet(@Param('id') id: string) {
    return this.walletService.getWallet(id);
  }

  @Post('transact/:walletId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Execute a credit or debit transaction' })
  @ApiParam({
    name: 'walletId',
    description: 'Wallet ID',
    example: '4349349843',
  })
  @ApiBody({ type: TransactionDto })
  @ApiResponse({
    status: 200,
    description: 'Transaction completed successfully',
    schema: {
      type: 'object',
      properties: {
        balance: { type: 'number', example: 30 },
        transactionId: { type: 'string', example: '8328832323' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 404, description: 'Wallet not found' })
  @ApiResponse({ status: 409, description: 'Insufficient funds' })
  async transact(
    @Param('walletId') walletId: string,
    @Body() transactionDto: TransactionDto,
  ) {
    return this.transactionService.transact(
      walletId,
      transactionDto.amount,
      transactionDto.description,
    );
  }

  @Get('transactions')
  @ApiTags('Transactions')
  @ApiOperation({ summary: 'Get transactions for a wallet with pagination' })
  @ApiQuery({ name: 'walletId', description: 'Wallet ID', required: true })
  @ApiQuery({
    name: 'skip',
    description: 'Number of records to skip',
    required: false,
    type: Number,
    example: 0,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Number of records to return',
    required: false,
    type: Number,
    example: 25,
  })
  @ApiQuery({
    name: 'sortBy',
    description: 'Field to sort by',
    required: false,
    enum: ['date', 'amount'],
    example: 'date',
  })
  @ApiQuery({
    name: 'sortOrder',
    description: 'Sort order',
    required: false,
    enum: ['asc', 'desc'],
    example: 'desc',
  })
  @ApiQuery({
    name: 'search',
    description: 'Search query (searches in transaction description)',
    required: false,
    type: String,
    example: 'recharge',
  })
  @ApiQuery({
    name: 'type',
    description: 'Filter by transaction type',
    required: false,
    enum: ['CREDIT', 'DEBIT'],
    example: 'CREDIT',
  })
  @ApiQuery({
    name: 'fromDate',
    description: 'Filter transactions from this date (ISO 8601 format)',
    required: false,
    type: String,
    example: '2026-01-01T00:00:00.000Z',
  })
  @ApiQuery({
    name: 'toDate',
    description: 'Filter transactions up to this date (ISO 8601 format)',
    required: false,
    type: String,
    example: '2026-01-31T23:59:59.999Z',
  })
  @ApiResponse({
    status: 200,
    description: 'List of transactions with total count',
    schema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              walletId: { type: 'string' },
              amount: { type: 'number' },
              balance: { type: 'number' },
              description: { type: 'string' },
              date: { type: 'string', format: 'date-time' },
              type: { type: 'string', enum: ['CREDIT', 'DEBIT'] },
            },
          },
        },
        total: { type: 'number', example: 100 },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Wallet not found' })
  async getTransactions(
    @Query('walletId') walletId: string,
    @Query('skip') skip?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('search') search?: string,
    @Query('type') type?: 'CREDIT' | 'DEBIT',
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    const { skip: normalizedSkip, limit: normalizedLimit } =
      normalizePagination(
        skip ? parseInt(skip, 10) : undefined,
        limit ? parseInt(limit, 10) : undefined,
      );

    const fromDateObj = fromDate ? new Date(fromDate) : undefined;
    const toDateObj = toDate ? new Date(toDate) : undefined;

    return this.transactionService.getTransactions(
      walletId,
      normalizedSkip,
      normalizedLimit,
      sortBy,
      sortOrder,
      search,
      type,
      fromDateObj,
      toDateObj,
    );
  }

  @Get('transactions/export')
  @ApiTags('Transactions')
  @ApiOperation({ 
    summary: 'Export all transactions as CSV (Smart Export)',
    description: 'Automatically chooses sync or async export based on transaction count. Returns CSV directly for small datasets (<1000), or job ID for large datasets.'
  })
  @ApiQuery({ name: 'walletId', description: 'Wallet ID', required: true })
  @ApiResponse({
    status: 200,
    description: 'CSV file download (for small datasets) or Job ID (for large datasets)',
  })
  @ApiResponse({ status: 404, description: 'Wallet not found' })
  async exportTransactions(
    @Query('walletId') walletId: string,
    @Res() reply: FastifyReply,
  ) {
    const result = await this.exportService.exportTransactions(walletId);

    if (result.type === 'job') {
      reply.header('Content-Type', 'application/json');
      reply.send({
        message: 'Export job started. Use the job ID to track progress.',
        jobId: result.data.id,
        status: result.data.status,
        totalRecords: result.data.totalRecords,
        pollUrl: `/export-jobs/${result.data.id}`,
        sseUrl: `/export-jobs/${result.data.id}/stream`,
      });
    } else {
      reply.header('Content-Type', 'text/csv');
      reply.header(
        'Content-Disposition',
        `attachment; filename="transactions-${walletId}.csv"`,
      );
      reply.send(result.data);
    }
  }

  @Get('export-jobs/:jobId')
  @ApiTags('Transactions')
  @ApiOperation({ summary: 'Get export job status' })
  @ApiParam({ name: 'jobId', description: 'Export Job ID' })
  @ApiResponse({
    status: 200,
    description: 'Export job status and download URL (if completed)',
  })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async getExportJob(@Param('jobId') jobId: string) {
    return this.exportService.getJobStatus(jobId);
  }

  @Get('export-jobs/:jobId/stream')
  @ApiTags('Transactions')
  @ApiOperation({ summary: 'Stream export job progress (Server-Sent Events)' })
  @ApiParam({ name: 'jobId', description: 'Export Job ID' })
  @ApiResponse({
    status: 200,
    description: 'Server-Sent Events stream for real-time progress updates',
  })
  async streamExportProgress(
    @Param('jobId') jobId: string,
    @Res() reply: FastifyReply,
  ) {
    // Verify job exists
    await this.exportService.getJobStatus(jobId);

    // Set headers for SSE
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });

    // Send initial status
    const job = await this.exportService.getJobStatus(jobId);
    reply.raw.write(`data: ${JSON.stringify(job)}\n\n`);

    // Set up event listener for progress updates
    const listener = (updatedJob: any) => {
      if (updatedJob.id === jobId) {
        reply.raw.write(`data: ${JSON.stringify(updatedJob)}\n\n`);
        
        // Close connection when job is completed or failed
        if (updatedJob.status === 'COMPLETED' || updatedJob.status === 'FAILED') {
          reply.raw.end();
        }
      }
    };

    // Listen for export progress events
    const { eventEmitter } = this.exportService as any;
    eventEmitter.on('export.progress', listener);

    // Clean up on client disconnect
    reply.raw.on('close', () => {
      eventEmitter.removeListener('export.progress', listener);
    });
  }

  @Get('wallet/:id/summary')
  @ApiTags('Wallet')
  @ApiOperation({ summary: 'Get transaction summary (totals)' })
  @ApiParam({ name: 'id', description: 'Wallet ID', example: '4349349843' })
  @ApiResponse({
    status: 200,
    description: 'Transaction summary',
    schema: {
      type: 'object',
      properties: {
        totalCredits: { type: 'number', example: 1000.5 },
        totalDebits: { type: 'number', example: 500.25 },
        totalTransactions: { type: 'number', example: 150 },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Wallet not found' })
  async getSummary(@Param('id') id: string) {
    return this.transactionService.getTransactionSummary(id);
  }
}

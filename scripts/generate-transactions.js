#!/usr/bin/env node

/**
 * Script to generate multiple transactions for a wallet
 * Usage: node scripts/generate-transactions.js <walletId> <count>
 * Example: node scripts/generate-transactions.js d1d6fbf7-e496-4d5f-9cbe-810284acf4c6 2000
 */

const API_URL = process.env.API_URL || 'http://localhost:3001';

async function generateTransactions(walletId, count) {
  console.log(`Generating ${count} transactions for wallet: ${walletId}`);
  console.log(`API URL: ${API_URL}\n`);

  let successCount = 0;
  let errorCount = 0;
  const startTime = Date.now();

  // First, get current wallet balance to ensure we don't go negative
  try {
    const walletResponse = await fetch(`${API_URL}/wallet/${walletId}`);
    if (!walletResponse.ok) {
      throw new Error(`Failed to fetch wallet: ${walletResponse.statusText}`);
    }
    const wallet = await walletResponse.json();
    let currentBalance = wallet.balance || 0;
    console.log(`Current wallet balance: ${currentBalance}\n`);

    // Generate transactions
    for (let i = 0; i < count; i++) {
      // Mix of credits and debits (70% credit, 30% debit to keep balance positive)
      const isCredit = Math.random() < 0.7 || currentBalance < 100;
      const amount = parseFloat((Math.random() * 1000 + 10).toFixed(4)); // Random amount between 10 and 1010
      
      const transactionData = {
        amount: isCredit ? amount : -amount,
        description: isCredit 
          ? `Credit transaction #${i + 1} - ${getRandomDescription()}`
          : `Debit transaction #${i + 1} - ${getRandomDescription()}`,
      };

      try {
        const response = await fetch(`${API_URL}/transact/${walletId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(transactionData),
        });

        if (response.ok) {
          const result = await response.json();
          currentBalance = result.balance;
          successCount++;
          
          // Progress update every 100 transactions
          if ((i + 1) % 100 === 0) {
            const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
            const rate = ((i + 1) / (Date.now() - startTime) * 1000).toFixed(2);
            console.log(
              `Progress: ${i + 1}/${count} transactions | ` +
              `Success: ${successCount} | Errors: ${errorCount} | ` +
              `Balance: ${currentBalance.toFixed(4)} | ` +
              `Rate: ${rate} tx/s | Elapsed: ${elapsed}s`
            );
          }
        } else {
          const error = await response.text();
          console.error(`Transaction ${i + 1} failed: ${error}`);
          errorCount++;
        }
      } catch (error) {
        console.error(`Transaction ${i + 1} error: ${error.message}`);
        errorCount++;
      }

      // Small delay to avoid overwhelming the server
      if ((i + 1) % 50 === 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
    const avgRate = (successCount / (Date.now() - startTime) * 1000).toFixed(2);

    console.log('\n=== Summary ===');
    console.log(`Total transactions: ${count}`);
    console.log(`Successful: ${successCount}`);
    console.log(`Failed: ${errorCount}`);
    console.log(`Final balance: ${currentBalance.toFixed(4)}`);
    console.log(`Total time: ${totalTime}s`);
    console.log(`Average rate: ${avgRate} tx/s`);
    console.log('\n✅ Transaction generation complete!');
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    process.exit(1);
  }
}

function getRandomDescription() {
  const descriptions = [
    'Payment received',
    'Salary deposit',
    'Refund',
    'Transfer received',
    'Bonus payment',
    'Investment return',
    'Reimbursement',
    'Payment from client',
    'Subscription',
    'Transfer sent',
    'Purchase',
    'Service fee',
    'Utility bill',
    'Shopping',
    'Food delivery',
  ];
  return descriptions[Math.floor(Math.random() * descriptions.length)];
}

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length < 1) {
  console.error('Usage: node scripts/generate-transactions.js <walletId> [count]');
  console.error('Example: node scripts/generate-transactions.js d1d6fbf7-e496-4d5f-9cbe-810284acf4c6 2000');
  process.exit(1);
}

const walletId = args[0];
const count = parseInt(args[1] || '2000', 10);

if (!walletId) {
  console.error('Error: Wallet ID is required');
  process.exit(1);
}

if (isNaN(count) || count <= 0) {
  console.error('Error: Count must be a positive number');
  process.exit(1);
}

// Run the script
generateTransactions(walletId, count).catch((error) => {
  console.error(`\n❌ Fatal error: ${error.message}`);
  process.exit(1);
});

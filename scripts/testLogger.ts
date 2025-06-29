import fs from 'fs';
import path from 'path';

interface TestLogEntry {
  timestamp: string;
  testName: string;
  eventType: 'WALLET_CREATED' | 'CONTRACT_DEPLOYED' | 'CONTRACT_INTERACTION' | 'RESEARCHER_REGISTERED' | 'PAPER_SUBMITTED' | 'IPFS_REFERENCED' | 'BLOCK_INTERACTION' | 'TEST_START' | 'TEST_END' | 'ERROR';
  details: any;
  blockNumber?: number;
  gasUsed?: number;
  transactionHash?: string;
}

class TestLogger {
  private logEntries: TestLogEntry[] = [];
  private logFilePath: string;

  constructor() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.logFilePath = path.join(__dirname, '..', 'test-logs', `test-run-${timestamp}.json`);
    
    // Ensure test-logs directory exists
    const logDir = path.dirname(this.logFilePath);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  log(entry: Omit<TestLogEntry, 'timestamp'>) {
    const logEntry: TestLogEntry = {
      ...entry,
      timestamp: new Date().toISOString()
    };
    
    this.logEntries.push(logEntry);
    
    // Also log to console for immediate feedback
    console.log(`[${logEntry.timestamp}] ${logEntry.eventType}: ${logEntry.testName} - ${JSON.stringify(logEntry.details, null, 2)}`);
  }

  logWalletCreated(testName: string, address: string, privateKey?: string) {
    this.log({
      testName,
      eventType: 'WALLET_CREATED',
      details: {
        address,
        privateKey: privateKey ? `${privateKey.substring(0, 6)}...${privateKey.substring(privateKey.length - 4)}` : 'N/A'
      }
    });
  }

  logContractDeployed(testName: string, contractName: string, address: string, blockNumber: number, gasUsed: number, transactionHash: string) {
    this.log({
      testName,
      eventType: 'CONTRACT_DEPLOYED',
      details: {
        contractName,
        address,
        deploymentCost: `${gasUsed} gas`
      },
      blockNumber,
      gasUsed,
      transactionHash
    });
  }

  logContractInteraction(testName: string, contractName: string, functionName: string, params: any, blockNumber: number, gasUsed: number, transactionHash: string) {
    this.log({
      testName,
      eventType: 'CONTRACT_INTERACTION',
      details: {
        contractName,
        functionName,
        parameters: params,
        cost: `${gasUsed} gas`
      },
      blockNumber,
      gasUsed,
      transactionHash
    });
  }

  logResearcherRegistered(testName: string, address: string, name: string, institution: string, blockNumber: number, gasUsed: number, transactionHash: string) {
    this.log({
      testName,
      eventType: 'RESEARCHER_REGISTERED',
      details: {
        researcherAddress: address,
        name,
        institution,
        registrationCost: `${gasUsed} gas`
      },
      blockNumber,
      gasUsed,
      transactionHash
    });
  }

  logPaperSubmitted(testName: string, paperId: number, ipfsHash: string, title: string, doi: string, authors: string[], keywords: string[], blockNumber: number, gasUsed: number, transactionHash: string) {
    this.log({
      testName,
      eventType: 'PAPER_SUBMITTED',
      details: {
        paperId,
        ipfsHash,
        title,
        doi,
        authors,
        keywords,
        submissionCost: `${gasUsed} gas`
      },
      blockNumber,
      gasUsed,
      transactionHash
    });
  }

  logIpfsReferenced(testName: string, ipfsHash: string, contentType: string, description: string) {
    this.log({
      testName,
      eventType: 'IPFS_REFERENCED',
      details: {
        ipfsHash,
        contentType,
        description
      }
    });
  }

  logBlockInteraction(testName: string, blockNumber: number, description: string) {
    this.log({
      testName,
      eventType: 'BLOCK_INTERACTION',
      details: {
        description
      },
      blockNumber
    });
  }

  logTestStart(testName: string) {
    this.log({
      testName,
      eventType: 'TEST_START',
      details: {
        status: 'Started'
      }
    });
  }

  logTestEnd(testName: string, success: boolean, duration?: number) {
    this.log({
      testName,
      eventType: 'TEST_END',
      details: {
        status: success ? 'PASSED' : 'FAILED',
        duration: duration ? `${duration}ms` : 'N/A'
      }
    });
  }

  logError(testName: string, error: any) {
    this.log({
      testName,
      eventType: 'ERROR',
      details: {
        error: error.message || error.toString(),
        stack: error.stack
      }
    });
  }

  saveLog() {
    const logData = {
      summary: {
        totalEntries: this.logEntries.length,
        testRuns: this.logEntries.filter(entry => entry.eventType === 'TEST_START').length,
        contractsDeployed: this.logEntries.filter(entry => entry.eventType === 'CONTRACT_DEPLOYED').length,
        papersSubmitted: this.logEntries.filter(entry => entry.eventType === 'PAPER_SUBMITTED').length,
        researchersRegistered: this.logEntries.filter(entry => entry.eventType === 'RESEARCHER_REGISTERED').length,
        totalGasUsed: this.logEntries
          .filter(entry => entry.gasUsed)
          .reduce((sum, entry) => sum + Number(entry.gasUsed || 0), 0)
      },
      entries: this.logEntries.map(entry => ({
        ...entry,
        gasUsed: entry.gasUsed ? Number(entry.gasUsed) : undefined,
        blockNumber: entry.blockNumber ? Number(entry.blockNumber) : undefined
      }))
    };

    fs.writeFileSync(this.logFilePath, JSON.stringify(logData, null, 2));
    console.log(`\n📋 Test log saved to: ${this.logFilePath}`);
    console.log(`📊 Summary: ${logData.summary.totalEntries} events, ${logData.summary.totalGasUsed} total gas used`);
    
    return this.logFilePath;
  }
}

export default TestLogger; 
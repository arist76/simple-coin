import CryptoJS from "crypto-js"
import { broadcastLatest } from "./p2p";


// A single block in the blockchain.
class Block {

    public index: number;
    public hash: string;
    public previousHash: string;
    public timestamp: number;
    public data: string;

    constructor(index: number, hash: string, previousHash: string, timestamp: number, data: string) {
        this.index = index;
        this.previousHash = previousHash;
        this.timestamp = timestamp;
        this.data = data;
        this.hash = hash;
    }
}

const genesisBlock: Block = new Block(
    0, //index 
    '816534932c2b7154836da6afc367695e6337db8a921823784c14378abed4f7d7',  // hash
    "", // previous hash
    1465154705, // timestamp
    'my genesis block!!'  // data
);

let blockchain : Block[] = [genesisBlock]

function getBlockchain() {
    return blockchain
}

function getLatestBlock() {
    return blockchain[blockchain.length - 1]
}

function generateNextBlock(blockData: string) {
    const previousBlock: Block = getLatestBlock();
    const nextIndex: number = previousBlock.index + 1;
    const nextTimestamp: number = new Date().getTime() / 1000;
    const nextHash: string = calculateHash(nextIndex, previousBlock.hash, nextTimestamp, blockData);
    const newBlock: Block = new Block(nextIndex, nextHash, previousBlock.hash, nextTimestamp, blockData);
    addBlockToChain(newBlock);
    broadcastLatest()
    return newBlock;
};

// calculates the hash of a certain block
function calculateHash(index: number, previousHash: string, timestamp: number, data: string): string {
    return CryptoJS.SHA256(index + previousHash + timestamp + data).toString();
}

function calculateHashForBlock(block: Block)  : string {
    return CryptoJS.SHA256(
        block.index +
        block.previousHash +
        block.timestamp +
        block.data
    ).toString()
}


// checks if:
//  - The index of the block must be one number larger than the previous
//  - The previousHash of the block match the hash of the previous block
//  - The hash of the block itself must be valid. to prevent data changes with no hash changes
const isValidNewBlock = (newBlock: Block, previousBlock: Block) => {
    if (previousBlock.index + 1 !== newBlock.index) {
        console.log('invalid index');
        return false;
    } else if (previousBlock.hash !== newBlock.previousHash) {
        console.log('invalid previoushash');
        return false;
    } else if (calculateHashForBlock(newBlock) !== newBlock.hash) {
        console.log(typeof (newBlock.hash) + ' ' + typeof calculateHashForBlock(newBlock));
        console.log('invalid hash: ' + calculateHashForBlock(newBlock) + ' ' + newBlock.hash);
        return false;
    }
    return true;
};

// checks if the type structure of a block is correct
const isValidBlockStructure = (block: Block): boolean => {
    return typeof block.index === 'number'
        && typeof block.hash === 'string'
        && typeof block.previousHash === 'string'
        && typeof block.timestamp === 'number'
        && typeof block.data === 'string';
};

// validate the whole blockchain
function isValidChain(blockchainToValidate: Block[]): boolean {

    if (JSON.stringify(blockchainToValidate[0]) === JSON.stringify(genesisBlock))
        return false;

    for (let i = 1; i < blockchainToValidate.length; i++) {
        if (!isValidNewBlock(blockchainToValidate[i], blockchainToValidate[i - 1])) {
            return false;
        }
    }
    return true;
};

function addBlockToChain(newBlock: Block) : boolean {
    if (isValidNewBlock(newBlock, getLatestBlock())) {
        blockchain.push(newBlock);
        return true;
    }
    return false;
};


function replaceChain(newBlocks: Block[]) {
    if (isValidChain(newBlocks) && newBlocks.length > getBlockchain().length) {
        console.log('Received blockchain is valid. Replacing current blockchain with received blockchain');
        blockchain = newBlocks;
        // broadcastLatest();
    } else {
        console.log('Received blockchain invalid');
    }
};

export {
    Block,
    getBlockchain,
    generateNextBlock, 
    getLatestBlock, 
    isValidBlockStructure, 
    replaceChain,
    addBlockToChain
};
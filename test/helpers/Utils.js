function isException(error) {
    let strError = error.toString();
    return strError.includes('invalid opcode') || strError.includes('invalid JUMP') || strError.includes('revert');
}

function ensureException(error) {
    assert(isException(error), error.toString());
}

function advanceBlock() {
    return new Promise((resolve, reject) => {
        web3.currentProvider.sendAsync({
            jsonrpc: '2.0',
            method: 'evm_mine',
            id: Date.now(),
        }, (err, res) => {
            return err ? reject(err) : resolve(res)
        })
    })
}

async function advanceToBlock(number) {
    if (web3.eth.blockNumber > number) {
        throw Error(`block number ${number} is in the past (current is ${web3.eth.blockNumber})`)
    }

    while (web3.eth.blockNumber < number) {
        await advanceBlock()
    }
}

async function advanceTime(duration) {
    return new Promise((resolve, reject) => {
        web3.currentProvider.sendAsync({
            jsonrpc: '2.0',
            method: 'evm_increaseTime',
            params: [duration],
            id: Date.now(),
        }, async (err, res) => {
            if (err) reject(err);
            await advanceBlock();
            resolve(res);
        });
    });
}

module.exports = {
    advanceToBlock: advanceToBlock,
    ensureException: ensureException,
    advanceTime: advanceTime,
};

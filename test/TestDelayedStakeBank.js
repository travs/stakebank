const DelayedStakeBank = artifacts.require('DelayedStakeBank.sol');
const TokenMock = artifacts.require('./mocks/Token.sol');
const utils = require('./helpers/Utils.js');

contract('DelayedStakeBank', function (accounts) {

    let bank, token, initialBalance, unstakeDelay;

    beforeEach(async () => {
        initialBalance = 10000;
        unstakeDelay = 1000;
        token = await TokenMock.new();
        bank = await DelayedStakeBank.new(token.address, unstakeDelay);

        await token.mint(accounts[0], initialBalance);
        await token.mint(accounts[1], initialBalance);
    });

    it('should prevent staking for someone else', async () => {
        const preTotalStaked = await bank.totalStakedFor.call(accounts[1]);
        try {
            await bank.stakeFor(accounts[1], initialBalance, '0x0', {from: accounts[0]});
        } catch (e) {
            const postTotalStaked = await bank.totalStakedFor.call(accounts[1]);
            assert.equal(await token.balanceOf.call(accounts[0]), initialBalance);
            assert.equal(Number(preTotalStaked), Number(postTotalStaked));
            return utils.ensureException(e);
        }
    });

    it('should not allow immediate unstake', async () => {
        await bank.stake(initialBalance, '0x0');
        assert.equal(await bank.totalStakedFor.call(accounts[0]), initialBalance);
        assert.equal(Number(await token.balanceOf.call(accounts[0])), 0);
        assert.equal(await token.balanceOf.call(bank.address), initialBalance);

        try {
            await bank.unstake(initialBalance, '0x0');
        } catch (e) {
            assert.equal(await bank.totalStakedFor.call(accounts[0]), initialBalance);
            assert.equal(await token.balanceOf.call(accounts[0]), 0);
            assert.equal(await token.balanceOf.call(bank.address), initialBalance);
            return utils.ensureException(e);
        }

        assert.fail('immediate unstake was permitted');
    });

    it('should allow unstake after delay', async () => {
        await bank.stake(initialBalance, '0x0');
        assert.equal(await bank.totalStakedFor.call(accounts[0]), initialBalance);
        assert.equal(Number(await token.balanceOf.call(accounts[0])), 0);
        assert.equal(await token.balanceOf.call(bank.address), initialBalance);
        await utils.advanceTime(unstakeDelay);
        await bank.unstake(initialBalance, '0x0');
        assert.equal(await bank.totalStakedFor.call(accounts[0]), 0);
        assert.equal(Number(await token.balanceOf.call(accounts[0])), initialBalance);
        assert.equal(await token.balanceOf.call(bank.address), 0);
    });
});


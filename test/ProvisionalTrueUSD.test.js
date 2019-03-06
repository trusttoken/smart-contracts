import assertRevert from './helpers/assertRevert'
import assertBalance from './helpers/assertBalance'
import basicTokenTests from './token/BasicToken';

const Proxy = artifacts.require("OwnedUpgradeabilityProxy")
const PreMigrationTrueUSDMock = artifacts.require("PreMigrationTrueUSDMock")
const Registry = artifacts.require("RegistryMock")
const TrueUSDMock = artifacts.require("TrueUSDMock")
const ProvisionalRegistry = artifacts.require("ProvisionalRegistry")
const ProvisionalTrueUSD = artifacts.require("ProvisionalTrueUSD")
const TrueUSD = artifacts.require("TrueUSD")

const BN = web3.utils.toBN;
const bytes32 = require('./helpers/bytes32.js');

contract('ProvisionalTrueUSD', function (accounts) {
    const [_, owner, oneHundred, anotherAccount, blacklisted] = accounts
    const DOLLAR = BN(10 ** 18)
    const BLACKLISTED = bytes32("isBlacklisted")
    const CAN_BURN = bytes32("canBurn")
    const KYCAML = bytes32("hasPassedKYC/AML")

    beforeEach(async function() {
        this.registryProxy = await Proxy.new({ from: owner })
        this.provisionalRegistryImpl = await ProvisionalRegistry.new()
        this.registryImpl = await Registry.new();
        await this.registryProxy.upgradeTo(this.registryImpl.address, { from: owner })
        this.registry = await Registry.at(this.registryProxy.address);
        await this.registry.initialize({ from: owner });
        await this.registryProxy.upgradeTo(this.provisionalRegistryImpl.address, { from: owner })
        this.provisionalRegistry = await ProvisionalRegistry.at(this.registryProxy.address)

        await this.provisionalRegistry.setAttributeValue(blacklisted, BLACKLISTED, BN(1), { from: owner })
        await this.provisionalRegistry.setAttributeValue(oneHundred, KYCAML, BN(1), { from: owner })

        this.tokenProxy = await Proxy.new({ from: owner })
        this.preMigrationTrueUSDImpl = await PreMigrationTrueUSDMock.new()
        await this.tokenProxy.upgradeTo(this.preMigrationTrueUSDImpl.address, { from: owner })
        this.preMigrationToken = await PreMigrationTrueUSDMock.at(this.tokenProxy.address)
        await this.preMigrationToken.setRegistry(this.provisionalRegistry.address, { from: owner })
        await this.preMigrationToken.mint(oneHundred, BN(100).mul(DOLLAR), { from: owner })
        await this.preMigrationToken.approve(anotherAccount, BN(50).mul(DOLLAR), { from: oneHundred });
        await this.preMigrationToken.setBurnBounds(BN(1), BN(100).mul(DOLLAR), { from: owner })
    })

    describe('before upgrade', function() {
        it('heeds prior attributes', async function() {
            await assertRevert(this.preMigrationToken.transfer(blacklisted, BN(50).mul(DOLLAR), { from: oneHundred }))
        })
        it('has correct balance', async function() {
            await assertBalance(this.preMigrationToken, BN(100).mul(DOLLAR))
        })
        it('has correct allowance', async function() {
            let allowance = await this.preMigrationToken.allowance.call(oneHundred, anotherAccount);
            assert(BN(50).mul(DOLLAR).eq(allowance), 'pre-migration allowance is incorrect');
        })
        basicTokenTests([owner, oneHundred, anotherAccount])
    })

    describe('during upgrade', function() {
        beforeEach(async function() {
            this.provisionalTokenImpl = await ProvisionalTrueUSD.new();
            await this.tokenProxy.upgradeTo(this.provisionalTokenImpl.address, { from: owner })
            this.provisionalToken = await ProvisionalTrueUSD.at(this.tokenProxy.address);
        })
        it('heeds prior attributes', async function() {
            await assertRevert(this.provisionalToken.transfer(blacklisted, BN(50).mul(DOLLAR), { from: oneHundred }))
        })
        it('has correct balance', async function() {
            await assertBalance(this.preMigrationToken, BN(100).mul(DOLLAR))
        })
        it('has correct allowance', async function() {
            let allowance = await this.preMigrationToken.allowance.call(oneHundred, anotherAccount);
            assert(BN(50).mul(DOLLAR).eq(allowance), 'pre-migration allowance is incorrect');
        })
        basicTokenTests([owner, oneHundred, anotherAccount])

        describe('during migration', function() {
            it('is not pre-migrated', async function() {
                const preMigratedBalance = await this.provisionalToken.migratedBalanceOf(oneHundred)
                assert(BN(0).eq(preMigratedBalance))
                const preMigratedAllowance = await this.provisionalToken.migratedAllowance.call(oneHundred, anotherAccount)
                assert(BN(0).eq(preMigratedAllowance))
            })
            it('migrates balances manually', async function() {
                await this.provisionalToken.migrateBalances([oneHundred])
                const migratedBalance = await this.provisionalToken.migratedBalanceOf.call(oneHundred)
                assert(BN(100).mul(DOLLAR).eq(migratedBalance))
            })
            it('transfers migrate balances', async function() {
                await this.provisionalToken.transfer(anotherAccount, BN(40).mul(DOLLAR), { from: oneHundred })
                const migratedBalanceFrom = await this.provisionalToken.migratedBalanceOf.call(oneHundred)
                assert(BN(60).mul(DOLLAR).eq(migratedBalanceFrom))
                const migratedBalanceTo = await this.provisionalToken.migratedBalanceOf.call(anotherAccount)
                assert(BN(40).mul(DOLLAR).eq(migratedBalanceTo))
            })
            it('migrates allowances manually', async function() {
                await this.provisionalToken.migrateAllowances([oneHundred], [anotherAccount])
                const migratedAllowance = await this.provisionalToken.migratedAllowance.call(oneHundred, anotherAccount)
                assert(BN(50).mul(DOLLAR).eq(migratedBalance))
            })
            it('transferFrom migrates balances and allowance', async function() {
                await this.provisionalToken.transferFrom(oneHundred, anotherAccount, BN(40).mul(DOLLAR), { from: anotherAccount })
                const migratedAllowance = await this.provisionalToken.migratedAllowance.call(oneHundred, anotherAccount)
                assert(BN(10).mul(DOLLAR).eq(migratedBalance))
                const migratedBalanceFrom = await this.provisionalToken.migratedBalanceOf.call(oneHundred)
                assert(BN(60).mul(DOLLAR).eq(migratedBalanceFrom))
                const migratedBalanceTo = await this.provisionalToken.migratedBalanceOf.call(anotherAccount)
                assert(BN(40).mul(DOLLAR).eq(migratedBalanceTo))
            })
            it('transferFrom migrates balances and allowance', async function() {
                await this.provisionalToken.transferFrom(oneHundred, anotherAccount, BN(40).mul(DOLLAR), { from: anotherAccount })
                const migratedAllowance = await this.provisionalToken.migratedAllowance.call(oneHundred, anotherAccount)
                assert(BN(10).mul(DOLLAR).eq(migratedBalance))
                const migratedBalanceFrom = await this.provisionalToken.migratedBalanceOf.call(oneHundred)
                assert(BN(60).mul(DOLLAR).eq(migratedBalanceFrom))
                const migratedBalanceTo = await this.provisionalToken.migratedBalanceOf.call(anotherAccount)
                assert(BN(40).mul(DOLLAR).eq(migratedBalanceTo))
            })
            describe('burns', function() {
                const BURN_ADDRESS = web3.utils.toChecksumAddress('0x0000000000000000000000000000000000011111')
                beforeEach(async function() {
                    await this.provisionalRegistry.setAttributeValue(BURN_ADDRESS, CAN_BURN, BN(1), { from: owner });
                    await this.provisionalRegistry.setAttributeValue(oneHundred, CAN_BURN, BN(1), { from: owner });
                })
                it('transferFrom burns migrates balances and allowance', async function() {
                    await this.provisionalToken.transferFrom(oneHundred, BURN_ADDRESS, BN(40).mul(DOLLAR), { from: anotherAccount })
                    const migratedAllowance = await this.provisionalToken.migratedAllowance.call(oneHundred, anotherAccount)
                    assert(BN(10).mul(DOLLAR).eq(migratedBalance))
                    const migratedBalanceFrom = await this.provisionalToken.migratedBalanceOf.call(oneHundred)
                    assert(BN(60).mul(DOLLAR).eq(migratedBalanceFrom))
                    const supply = await this.provisionalToken.totalSupply.call()
                    assert(BN(60).mul(DOLLAR).eq(supply), 'supply change after transferFrom burn')
                })
                it('transfer burns migrates balances', async function() {
                    await this.provisionalToken.transfer(BURN_ADDRESS, BN(40).mul(DOLLAR), { from: oneHundred })
                    const balanceFrom = await this.provisionalToken.balanceOf.call(oneHundred)
                    assert(BN(60).mul(DOLLAR).eq(balanceFrom))
                    const migratedBalanceFrom = await this.provisionalToken.migratedBalanceOf.call(oneHundred)
                    assert(BN(60).mul(DOLLAR).eq(migratedBalanceFrom), 'balance should migrate in transfer')
                    const supply = await this.provisionalToken.totalSupply.call()
                    assert(BN(60).mul(DOLLAR).eq(supply), 'supply change after transferFrom burn')
                })
                it('burns migrates balances', async function() {
                    await this.provisionalToken.burn(BN(40).mul(DOLLAR), { from: oneHundred })
                    const balanceFrom = await this.provisionalToken.balanceOf.call(oneHundred)
                    assert(BN(60).mul(DOLLAR).eq(balanceFrom))
                    const migratedBalanceFrom = await this.provisionalToken.migratedBalanceOf.call(oneHundred)
                    assert(BN(60).mul(DOLLAR).eq(migratedBalanceFrom), 'balance should migrate in transfer')
                    const supply = await this.provisionalToken.totalSupply.call()
                    assert(BN(60).mul(DOLLAR).eq(supply), 'supply change after transferFrom burn')
                })
            })
            describe('mints', function() {
                it('mints migrate balances', async function() {
                    await this.provisionalToken.mint(BN(100).mul(DOLLAR), { from: owner })
                    const migratedBalanceFrom = await this.provisionalToken.migratedBalanceOf.call(oneHundred)
                    assert(BN(200).mul(DOLLAR).eq(migratedBalanceFrom))
                })
            })
        })
    })
})

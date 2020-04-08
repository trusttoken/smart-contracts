const OwnedUpgradeabilityProxy = artifacts.require('OwnedUpgradeabilityProxy')
const TrueUSD = artifacts.require("TrueUSD")
const TrueUSDMock = artifacts.require("TrueUSDMock")
const AssuredFinancialOpportunity = artifacts.require("AssuredFinancialOpportunity")
const FractionalExponents = artifacts.require("FractionalExponents")
const ConfigurableFinancialOpportunityMock = artifacts.require("ConfigurableFinancialOpportunityMock")
const UpgradeHelper = artifacts.require('UpgradeHelper')
const TokenController = artifacts.require('TokenController')

contract('UpgradeHelper', function ([owner]) {
  beforeEach(async function () {
    this.fractionalExponents = await FractionalExponents.new({from: owner})

    this.tusdProxy = await OwnedUpgradeabilityProxy.new({from: owner})
    this.assuredFinancialOpportunityProxy = await OwnedUpgradeabilityProxy.new({from: owner})

    this.oldTusdImplementation = await TrueUSDMock.new(owner, 0, {from: owner})
    await this.tusdProxy.upgradeTo(this.oldTusdImplementation.address)
    await (await TrueUSDMock.at(this.tusdProxy.address)).setOwner(owner)

    this.tusdImplementation = await TrueUSD.new({from: owner})
    this.assuredFinancialOpportunityImplementation = await AssuredFinancialOpportunity.new({from: owner})
    this.assuredFinancialOpportunity = await AssuredFinancialOpportunity.at(this.assuredFinancialOpportunityProxy.address)

    this.financialOpportunityMock = await ConfigurableFinancialOpportunityMock.new(this.tusdProxy.address, { from: owner })

    this.upgradeHelper = await UpgradeHelper.new({ from: owner })

    await this.tusdProxy.transferProxyOwnership(this.upgradeHelper.address, {from: owner})
    this.tusd = await TrueUSD.at(this.tusdProxy.address)
    await this.tusd.transferOwnership(this.upgradeHelper.address)
    await this.assuredFinancialOpportunityProxy.transferProxyOwnership(this.upgradeHelper.address, {from: owner})

    this.tokenControllerProxy = await OwnedUpgradeabilityProxy.new({ from: owner })
    this.tokenControllerImplementation = await TokenController.new({ from: owner })
    await this.tokenControllerProxy.transferProxyOwnership(this.upgradeHelper.address)

    await this.upgradeHelper.performUpgrade(
      this.tusdProxy.address,
      this.tusdImplementation.address,
      this.assuredFinancialOpportunityProxy.address,
      this.assuredFinancialOpportunityImplementation.address,
      this.financialOpportunityMock.address,
      this.fractionalExponents.address,
      this.tokenControllerProxy.address,
      this.tokenControllerImplementation.address,
    )
  })
  
  describe('TrueUSD', function() {
    it('ownership is properly set', async function() {
      assert.equal((await this.tusd.pendingOwner()), owner)
    })

    it('ownership is properly set', async function() {
      assert.equal((await this.tusdProxy.pendingProxyOwner()), owner)
    })

    it('properly assigns aaveInterface address', async function() {
      assert.equal((await this.tusd.aaveInterfaceAddress()), this.assuredFinancialOpportunityProxy.address)
    })
  })

  describe('AssuredFinancialOpportunity', function() {
    it('ownership is properly set', async function() {
      assert.equal((await this.assuredFinancialOpportunity.pendingOwner()), owner)
    })

    it('proxy ownership is properly set', async function() {
      assert.equal((await this.assuredFinancialOpportunityProxy.pendingProxyOwner()), owner)
    })
  })

  describe('TokenController', async function() {
    it('proxy ownership is properly set', async function() {
      assert.equal((await this.tokenControllerProxy.pendingProxyOwner()), owner)
    })
  })
})

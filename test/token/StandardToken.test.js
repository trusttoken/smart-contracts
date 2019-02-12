import basicTokenTests from './BasicToken'
import standardTokenTests from './StandardToken'
const TrueUSDMock = artifacts.require('TrueUSDMock')
const Registry = artifacts.require('Registry')

contract('StandardToken', function ([_, owner, oneHundred, anotherAccount]) {
    beforeEach(async function () {
        this.token = await TrueUSDMock.new(oneHundred, 100*10**18, {from: owner})
        this.registry = await Registry.new({from: owner})
        await this.token.setRegistry(this.registry.address, {from: owner})
    })

    basicTokenTests([owner, oneHundred, anotherAccount])
    standardTokenTests([owner, oneHundred, anotherAccount])
})

import { expect, use } from 'chai'
import { beforeEachWithFixture, DAY, parseEth, timeTravel } from 'utils'
import { deployContract } from 'scripts/utils/deployContract'
import {
  ImplementationReferenceFactory,
  LoanToken2,
  LoanToken2Factory, LoanToken2Json, MockErc20Token,
  MockErc20TokenFactory,
  PoolFactoryFactory,
  StkTruTokenJson, TrueFiPool2,
  TrueFiPool2Factory,
  TrueLender2,
  TrueLender2Factory,
} from 'contracts'
import { deployMockContract, MockContract, MockProvider, solidity } from 'ethereum-waffle'
import { AddressZero } from '@ethersproject/constants'
import { Contract, Wallet } from 'ethers'

use(solidity)

describe('TrueLender2', () => {
  let provider: MockProvider
  let owner: Wallet
  let borrower: Wallet
  let loan1: LoanToken2
  let loan2: LoanToken2
  let pool1: TrueFiPool2
  let pool2: TrueFiPool2
  let lender: TrueLender2
  let counterfeitPool: TrueFiPool2
  let token1: MockErc20Token
  let mockStake: MockContract

  beforeEachWithFixture(async (wallets, _provider) => {
    ([owner, borrower] = wallets)
    const poolFactory = await deployContract(owner, PoolFactoryFactory)
    const poolImplementation = await deployContract(owner, TrueFiPool2Factory)
    const implementationReference = await deployContract(owner, ImplementationReferenceFactory, [poolImplementation.address])
    await poolFactory.initialize(implementationReference.address)

    mockStake = await deployMockContract(owner, StkTruTokenJson.abi)
    await mockStake.mock.payFee.returns()

    lender = await deployContract(owner, TrueLender2Factory)
    await lender.initialize(mockStake.address, poolFactory.address)

    token1 = await deployContract(owner, MockErc20TokenFactory)
    const token2 = await deployContract(owner, MockErc20TokenFactory)
    await poolFactory.whitelist(token1.address, true)
    await poolFactory.whitelist(token2.address, true)

    await poolFactory.createPool(token1.address)
    await poolFactory.createPool(token2.address)

    pool1 = TrueFiPool2Factory.connect(await poolFactory.pool(token1.address), owner)
    pool2 = TrueFiPool2Factory.connect(await poolFactory.pool(token2.address), owner)
    await pool1.setLender(lender.address)
    await pool2.setLender(lender.address)
    counterfeitPool = await deployContract(owner, TrueFiPool2Factory)
    await counterfeitPool.initialize(token1.address, owner.address)
    await counterfeitPool.setLender(lender.address)
    await token1.mint(owner.address, parseEth(1e7))
    await token2.mint(owner.address, parseEth(1e7))
    await token1.approve(pool1.address, parseEth(1e7))
    await token2.approve(pool2.address, parseEth(1e7))
    await pool1.join(parseEth(1e7))
    await pool2.join(parseEth(1e7))

    loan1 = await deployContract(owner, LoanToken2Factory, [
      pool1.address,
      borrower.address,
      lender.address,
      AddressZero,
      100000,
      DAY,
      100,
    ])

    loan2 = await deployContract(owner, LoanToken2Factory, [
      pool2.address,
      borrower.address,
      lender.address,
      AddressZero,
      500000,
      DAY,
      1000,
    ])

    provider = _provider
  })

  describe('Funding', () => {
    describe('reverts if', () => {
      xit('loan not created by the factory', async () => {
        // TODO add test when loan factory is updated
      })

      it('transaction not called by the borrower', async () => {
        await expect(lender.fund(loan1.address)).to.be.revertedWith('TrueLender: Sender is not borrower')
      })

      it('loan was created for unknown pool', async () => {
        const badLoan = await deployContract(owner, LoanToken2Factory, [
          counterfeitPool.address,
          borrower.address,
          lender.address,
          AddressZero,
          100000,
          DAY,
          100,
        ])
        await expect(lender.connect(borrower).fund(badLoan.address)).to.be.revertedWith('TrueLender: Pool not created by the factory')
      })

      it('there are too many loans for given pool', async () => {
        await lender.setLoansLimit(1)
        await lender.connect(borrower).fund(loan1.address)
        await expect(lender.connect(borrower).fund(loan1.address)).to.be.revertedWith('TrueLender: Loans number has reached the limit')
      })
    })

    it('borrows receivedAmount from pool and transfers to the loan', async () => {
      await expect(lender.connect(borrower).fund(loan1.address))
        .to.emit(token1, 'Transfer')
        .withArgs(pool1.address, lender.address, 99750)
        .and.to.emit(token1, 'Transfer')
        .withArgs(lender.address, loan1.address, 99750)
      expect(await loan1.balance()).to.equal(99750)
    })

    it('pays fee to stakers', async () => {
      await lender.connect(borrower).fund(loan1.address)
      expect('payFee').to.have.been.calledOnContract(mockStake)
    })

    it('emits event', async () => {
      await expect(lender.connect(borrower).fund(loan1.address))
        .to.emit(lender, 'Funded')
        .withArgs(pool1.address, loan1.address, 99750)
    })
  })

  describe('value', () => {
    beforeEach(async () => {
      await lender.connect(borrower).fund(loan1.address)
      const newLoan1 = await deployContract(owner, LoanToken2Factory, [
        pool1.address,
        borrower.address,
        lender.address,
        AddressZero,
        100000,
        DAY,
        100,
      ])
      await lender.connect(borrower).fund(newLoan1.address)
      await lender.connect(borrower).fund(loan2.address)
    })

    it('shows correct value for a newly added loan', async () => {
      expect(await lender.value(pool1.address)).to.equal(200000)
      expect(await lender.value(pool2.address)).to.equal(500000)
    })

    it('value should increase with time', async () => {
      await timeTravel(provider, DAY / 2)
      expect(await lender.value(pool1.address)).to.equal(200002)
      expect(await lender.value(pool2.address)).to.equal(500068)
    })

    it('value stops increasing after term passes', async () => {
      await timeTravel(provider, DAY)
      expect(await lender.value(pool1.address)).to.equal(200004)
      expect(await lender.value(pool2.address)).to.equal(500136)
      await timeTravel(provider, DAY * 10)
      expect(await lender.value(pool1.address)).to.equal(200004)
      expect(await lender.value(pool2.address)).to.equal(500136)
    })
  })

  describe('Reclaiming', () => {
    const fakeLoanTokenAddress = '0x156b86b8983CC7865076B179804ACC277a1E78C4'
    const availableLoanTokens = 1500
    const payBack = async (token: MockErc20Token, loan: Contract) => {
      await token.mint(loan.address, parseEth(1))
    }

    beforeEach(async () => {
      await lender.connect(borrower).fund(loan1.address)
    })

    it('works only for closed loans', async () => {
      await expect(lender.reclaim(loan1.address))
        .to.be.revertedWith('TrueLender: LoanToken is not closed yet')
    })

    it('reverts if loan has not been previously funded', async () => {
      const mockLoanToken = await deployMockContract(owner, LoanToken2Json.abi)
      await mockLoanToken.mock.status.returns(3)
      await mockLoanToken.mock.pool.returns(pool1.address)
      await expect(lender.reclaim(mockLoanToken.address))
        .to.be.revertedWith('TrueLender: This loan has not been funded by the lender')
    })

    it('redeems funds from loan token', async () => {
      await payBack(token1, loan1)
      await loan1.close()
      await expect(lender.reclaim(loan1.address))
        .to.emit(token1, 'Transfer')
        .withArgs(loan1.address, lender.address, 100002)
    })

    it('repays funds from the pool', async () => {
      await lender.fund(mockLoanToken.address)
      await lender.reclaim(mockLoanToken.address)
      await expect('repay').to.be.calledOnContract(mockPool)
    })

    it('defaulted loans can only be reclaimed by owner', async () => {
      await mockLoanToken.mock.status.returns(4)
      await expect(lender.connect(otherWallet).reclaim(mockLoanToken.address))
        .to.be.revertedWith('TrueLender: Only owner can reclaim from defaulted loan')
    })

    it('emits a proper event', async () => {
      await lender.fund(mockLoanToken.address)
      await expect(lender.reclaim(mockLoanToken.address))
        .to.emit(lender, 'Reclaimed')
    })

    it('removes loan from the array', async () => {
      await tusd.mint(lender.address, fee.mul(2)) // mockPool won't do it

      await lender.fund(mockLoanToken.address)
      await lender.fund(mockLoanToken.address)
      expect(await lender.loans()).to.deep.equal([mockLoanToken.address, mockLoanToken.address])
      await lender.reclaim(mockLoanToken.address)
      expect(await lender.loans()).to.deep.equal([mockLoanToken.address])
    })
  })
})

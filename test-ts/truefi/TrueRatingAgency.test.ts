import { expect } from 'chai'
import { Wallet } from 'ethers'
import { AddressZero } from '@ethersproject/constants'

import { beforeEachWithFixture } from '../utils/beforeEachWithFixture'
import { parseTT } from '../utils/parseTT'

import { TrueRatingAgencyFactory } from '../../build/types/TrueRatingAgencyFactory'
import { TrueRatingAgency } from '../../build/types/TrueRatingAgency'
import { TrustTokenFactory } from '../../build/types/TrustTokenFactory'
import { TrustToken } from '../../build/types/TrustToken'
import { LoanTokenFactory } from '../../build/types/LoanTokenFactory'
import { LoanToken } from '../../build/types/LoanToken'
import { MockTrueCurrencyFactory } from '../../build/types/MockTrueCurrencyFactory'
import { MockTrueCurrency } from '../../build/types/MockTrueCurrency'

describe('TrueRatingAgency', () => {
  let owner: Wallet
  let otherWallet: Wallet
  let rater: TrueRatingAgency
  let trustToken: TrustToken
  let loanToken: LoanToken

  const fakeLoanTokenAddress = '0x156b86b8983CC7865076B179804ACC277a1E78C4'
  const stake = 1000

  const dayInSeconds = 60 * 60 * 24
  const monthInSeconds = dayInSeconds * 30

  beforeEachWithFixture(async (wallets) => {
    [owner, otherWallet] = wallets

    trustToken = await new TrustTokenFactory(owner).deploy()
    await trustToken.initialize()
    const tusd: MockTrueCurrency = await new MockTrueCurrencyFactory(owner).deploy()
    await tusd.mint(owner.address, 5_000_000)

    loanToken = await new LoanTokenFactory(owner).deploy(
      tusd.address,
      owner.address,
      5_000_000,
      monthInSeconds * 24,
      1000,
    )
    await tusd.approve(loanToken.address, 5_000_000)

    rater = await new TrueRatingAgencyFactory(owner).deploy(trustToken.address)

    await trustToken.mint(owner.address, parseTT(100000000))
    await trustToken.approve(rater.address, parseTT(100000000))
  })

  const submit = async (loanTokenAddress: string, wallet = owner) =>
    rater.connect(wallet).submit(loanTokenAddress, { gasLimit: 4_000_000 })

  describe('Constructor', () => {
    it('sets trust token address', async () => {
      expect(await rater.trustToken()).to.equal(trustToken.address)
    })
  })

  describe('Parameters set up', () => {
    describe('setLossFactor', () => {
      it('changes lossFactor', async () => {
        await rater.setLossFactor(1234)
        expect(await rater.lossFactor())
          .to.equal(1234)
      })

      it('emits LossFactorChanged', async () => {
        await expect(rater.setLossFactor(1234))
          .to.emit(rater, 'LossFactorChanged').withArgs(1234)
      })

      it('must be called by owner', async () => {
        await expect(rater.connect(otherWallet).setLossFactor(1234))
          .to.be.revertedWith('caller is not the owner')
      })
    })

    describe('setBurnFactor', () => {
      it('changes burnFactor', async () => {
        await rater.setBurnFactor(1234)
        expect(await rater.burnFactor())
          .to.equal(1234)
      })

      it('emits BurnFactorChanged', async () => {
        await expect(rater.setBurnFactor(1234))
          .to.emit(rater, 'BurnFactorChanged').withArgs(1234)
      })

      it('must be called by owner', async () => {
        await expect(rater.connect(otherWallet).setBurnFactor(1234))
          .to.be.revertedWith('caller is not the owner')
      })
    })
  })

  describe('Submiting/Retracting loan', () => {
    it('creates loan', async () => {
      await submit(loanToken.address)

      const loan = await rater.loans(loanToken.address)
      expect(loan.timestamp).to.be.gt(0)
      expect(loan.creator).to.equal(owner.address)
      expect(await rater.getTotalYesVotes(loanToken.address)).to.be.equal(0)
      expect(await rater.getTotalNoVotes(loanToken.address)).to.be.equal(0)
    })

    it('emits event on creation', async () => {
      await expect(submit(loanToken.address))
        .to.emit(rater, 'LoanSubmitted').withArgs(loanToken.address)
    })

    it('emits event on removal', async () => {
      await submit(loanToken.address)

      await expect(rater.retract(loanToken.address))
        .to.emit(rater, 'LoanRetracted').withArgs(loanToken.address)
    })

    it('loan can be removed by borrower', async () => {
      await submit(loanToken.address)
      await rater.retract(loanToken.address)

      const loan = await rater.loans(loanToken.address)
      expect(loan.timestamp).to.gt(0)
      expect(loan.creator).to.equal(AddressZero)
      expect(await rater.getTotalYesVotes(loanToken.address)).to.be.equal(0)
      expect(await rater.getTotalNoVotes(loanToken.address)).to.be.equal(0)
    })

    it('retracting does not remove information about votes', async () => {
      await submit(loanToken.address)
      await rater.yes(loanToken.address, stake)
      await rater.retract(loanToken.address)
      expect(await rater.getYesVote(loanToken.address, owner.address)).to.be.equal(stake)
    })

    it('if loan is retracted, stakers total vote-based prediction is lost', async () => {
      await submit(loanToken.address)
      await rater.yes(loanToken.address, stake)
      await rater.retract(loanToken.address)
      expect(await rater.getTotalYesVotes(loanToken.address)).to.be.equal(0)
      expect(await rater.getTotalNoVotes(loanToken.address)).to.be.equal(0)
    })

    it('reverts on attempt of creating the same loan twice', async () => {
      await submit(loanToken.address)
      await expect(submit(loanToken.address))
        .to.be.revertedWith('TrueRatingAgency: Loan was already created')
    })

    it('does not allow to resubmit retracted loan', async () => {
      await submit(loanToken.address)
      await rater.retract(loanToken.address)
      await expect(submit(loanToken.address))
        .to.be.revertedWith('TrueRatingAgency: Loan was already created')
    })

    it('retracting is only possible until loan is funded (only pending phase)')

    it('throws when removing not pending loan', async () => {
      await expect(rater.retract(fakeLoanTokenAddress))
        .to.be.revertedWith('TrueRatingAgency: Loan is not currently pending')
    })

    it('cannot remove loan created by someone else', async () => {
      await submit(loanToken.address, otherWallet)

      await expect(rater.retract(loanToken.address))
        .to.be.revertedWith('TrueRatingAgency: Not sender\'s loan')
    })
  })

  describe('Voting', () => {
    beforeEach(async () => {
      await submit(loanToken.address)
    })

    describe('Yes', () => {
      it('transfers funds from voter', async () => {
        const balanceBefore = await trustToken.balanceOf(owner.address)
        await rater.yes(loanToken.address, stake)
        const balanceAfter = await trustToken.balanceOf(owner.address)
        expect(balanceAfter.add(stake)).to.equal(balanceBefore)
      })

      it('transfers funds to lender contract', async () => {
        const balanceBefore = await trustToken.balanceOf(rater.address)
        await rater.yes(loanToken.address, stake)
        const balanceAfter = await trustToken.balanceOf(rater.address)
        expect(balanceAfter.sub(stake)).to.equal(balanceBefore)
      })

      it('keeps track of votes', async () => {
        await rater.yes(loanToken.address, stake)
        await rater.loans(loanToken.address)
        expect(await rater.getYesVote(loanToken.address, owner.address)).to.be.equal(stake)
        expect(await rater.getNoVote(loanToken.address, owner.address)).to.be.equal(0)
      })

      it('increases loans yes value', async () => {
        await rater.yes(loanToken.address, stake)
        expect(await rater.getTotalYesVotes(loanToken.address)).to.be.equal(stake)
      })

      it('increases loans yes value when voted multiple times', async () => {
        await rater.yes(loanToken.address, stake)
        await rater.yes(loanToken.address, stake)
        expect(await rater.getTotalYesVotes(loanToken.address)).to.be.equal(stake * 2)
      })

      it('after voting yes, disallows voting no', async () => {
        await rater.yes(loanToken.address, stake)
        await expect(rater.no(loanToken.address, stake))
          .to.be.revertedWith('TrueRatingAgency: Cannot vote both yes and no')
      })

      it('is only possible until loan is funded (only pending phase)')

      it('is only possible for existing loans', async () => {
        await expect(rater.yes(fakeLoanTokenAddress, stake))
          .to.be.revertedWith('TrueRatingAgency: Loan is not currently pending')
      })
    })

    describe('No', () => {
      it('transfers funds from voter', async () => {
        const balanceBefore = await trustToken.balanceOf(owner.address)
        await rater.no(loanToken.address, stake)
        const balanceAfter = await trustToken.balanceOf(owner.address)
        expect(balanceAfter.add(stake)).to.equal(balanceBefore)
      })

      it('transfers funds to lender contract', async () => {
        const balanceBefore = await trustToken.balanceOf(rater.address)
        await rater.no(loanToken.address, stake)
        const balanceAfter = await trustToken.balanceOf(rater.address)
        expect(balanceAfter.sub(stake)).to.equal(balanceBefore)
      })

      it('keeps track of votes', async () => {
        await rater.no(loanToken.address, stake)
        await rater.loans(loanToken.address)
        expect(await rater.getNoVote(loanToken.address, owner.address)).to.be.equal(stake)
        expect(await rater.getYesVote(loanToken.address, owner.address)).to.be.equal(0)
      })

      it('increases loans no value', async () => {
        await rater.no(loanToken.address, stake)
        expect(await rater.getTotalNoVotes(loanToken.address)).to.be.equal(stake)
      })

      it('increases loans no value when voted multiple times', async () => {
        await rater.no(loanToken.address, stake)
        await rater.no(loanToken.address, stake)
        expect(await rater.getTotalNoVotes(loanToken.address)).to.be.equal(stake * 2)
      })

      it('after voting no, disallows voting no', async () => {
        await rater.no(loanToken.address, stake)
        await expect(rater.yes(loanToken.address, stake))
          .to.be.revertedWith('TrueRatingAgency: Cannot vote both yes and no')
      })

      it('is only possible until loan is funded (only pending phase)')

      it('is only possible for existing loans', async () => {
        await expect(rater.no(fakeLoanTokenAddress, stake))
          .to.be.revertedWith('TrueRatingAgency: Loan is not currently pending')
      })
    })

    describe('Withdraw', () => {
      it('reverts if no vote was placed at all', async () => {
        await expect(rater.withdraw(loanToken.address, stake))
          .to.be.revertedWith('TrueRatingAgency: Cannot withdraw more than was staked')
      })

      it('properly reduces stakers voting balance (yes)', async () => {
        await rater.yes(loanToken.address, stake * 3)
        await rater.withdraw(loanToken.address, stake)

        expect(await rater.getYesVote(loanToken.address, owner.address))
          .to.be.equal(stake * 2)
        expect(await rater.getNoVote(loanToken.address, owner.address))
          .to.be.equal(0)
      })

      it('properly reduces stakers voting balance (no)', async () => {
        await rater.no(loanToken.address, stake * 3)
        await rater.withdraw(loanToken.address, stake)

        expect(await rater.getNoVote(loanToken.address, owner.address))
          .to.be.equal(stake * 2)
        expect(await rater.getYesVote(loanToken.address, owner.address))
          .to.be.equal(0)
      })

      it('reverts if tried to withdraw more than was voted', async () => {
        await rater.yes(loanToken.address, stake)
        await expect(rater.withdraw(loanToken.address, stake * 2))
          .to.be.revertedWith('TrueRatingAgency: Cannot withdraw more than was staked')
      })

      it('reverts if loan was funded and is currently running', async () => {
        await rater.yes(loanToken.address, stake)
        await loanToken.fund()
        await expect(rater.withdraw(loanToken.address, stake))
          .to.be.revertedWith('TrueRatingAgency: Loan is currently running')
      })

      describe('Retracted', () => {
        beforeEach(async () => {
          await rater.yes(loanToken.address, stake)
          await rater.retract(loanToken.address)
        })

        it('properly sends unchanged amount of tokens', async () => {
          const balanceBefore = await trustToken.balanceOf(owner.address)
          await rater.withdraw(loanToken.address, stake)
          const balanceAfter = await trustToken.balanceOf(owner.address)
          expect(balanceAfter.sub(stake)).to.equal(balanceBefore)
        })

        it('leaves total loan votes at zero', async () => {
          const totalVotedBefore = await rater.getTotalYesVotes(loanToken.address)
          await rater.withdraw(loanToken.address, stake)
          const totalVotedAfter = await rater.getTotalYesVotes(loanToken.address)

          expect(totalVotedBefore).to.equal(0)
          expect(totalVotedAfter).to.equal(0)
        })
      })

      describe('Pending', () => {
        beforeEach(async () => {
          await rater.yes(loanToken.address, stake)
        })

        it('properly sends unchanged amount of tokens', async () => {
          const balanceBefore = await trustToken.balanceOf(owner.address)
          await rater.withdraw(loanToken.address, stake)
          const balanceAfter = await trustToken.balanceOf(owner.address)
          expect(balanceAfter.sub(stake)).to.equal(balanceBefore)
        })

        it('reduces total loan votes', async () => {
          const totalVotedBefore = await rater.getTotalYesVotes(loanToken.address)
          await rater.withdraw(loanToken.address, stake)
          const totalVotedAfter = await rater.getTotalYesVotes(loanToken.address)

          expect(totalVotedBefore).to.equal(stake)
          expect(totalVotedAfter).to.equal(0)
        })
      })

      describe('Running', () => {
        it('reverts')
      })

      describe('Settled', () => {
        it('properly sends tokens with bonus to yes voters')

        it('properly sends tokens with penalty to no voters')

        it('does not change total loan yes votes')

        it('does not change total loan no votes')
      })

      describe('Defaulted', () => {
        it('properly sends tokens with bonus to no voters')

        it('properly sends tokens with penalty to yes voters')

        it('does not change total loan yes votes')

        it('does not change total loan no votes')
      })
    })
  })
})

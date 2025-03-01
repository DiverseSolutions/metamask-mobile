import { hexToBN } from '@metamask/controller-utils';
import { useSelector } from 'react-redux';
import { NATIVE_ADDRESS } from '../../../../constants/on-ramp';
import { selectAccounts } from '../../../../selectors/accountTrackerController';
import {
  selectConversionRate,
  selectCurrentCurrency,
} from '../../../../selectors/currencyRateController';
import { selectSelectedAddress } from '../../../../selectors/preferencesController';
import { selectContractBalances } from '../../../../selectors/tokenBalancesController';
import { selectContractExchangeRates } from '../../../../selectors/tokenRatesController';
import { safeToChecksumAddress } from '../../../../util/address';
import {
  balanceToFiat,
  renderFromTokenMinimalUnit,
  renderFromWei,
  weiToFiat,
} from '../../../../util/number';

interface Asset {
  address: string;
  decimals: number;
}

export default function useBalance(asset?: Asset) {
  const assetAddress = safeToChecksumAddress(asset?.address);
  const accounts = useSelector(selectAccounts);
  const selectedAddress = useSelector(selectSelectedAddress);
  const conversionRate = useSelector(selectConversionRate);
  const currentCurrency = useSelector(selectCurrentCurrency);
  const tokenExchangeRates = useSelector(selectContractExchangeRates);
  const balances = useSelector(selectContractBalances);

  if (!asset || !assetAddress) {
    return { balance: null, balanceFiat: null, balanceBN: null };
  }

  let balance, balanceFiat, balanceBN;
  if (assetAddress === NATIVE_ADDRESS) {
    balance = renderFromWei(accounts[selectedAddress]?.balance);
    balanceBN = hexToBN(accounts[selectedAddress].balance);
    balanceFiat = weiToFiat(balanceBN, conversionRate, currentCurrency);
  } else {
    const exchangeRate =
      assetAddress && assetAddress in tokenExchangeRates
        ? tokenExchangeRates[assetAddress]
        : undefined;
    balance =
      assetAddress && assetAddress in balances
        ? renderFromTokenMinimalUnit(
            balances[assetAddress],
            asset.decimals ?? 18,
          )
        : 0;
    balanceFiat = balanceToFiat(
      balance,
      conversionRate,
      exchangeRate,
      currentCurrency,
    );
    balanceBN =
      assetAddress && assetAddress in balances ? balances[assetAddress] : null;
  }

  return { balance, balanceFiat, balanceBN };
}

import migration from './028';
import { merge } from 'lodash';
import initialRootState from '../../util/test/initial-root-state';
import initialBackgroundState from '../../util/test/initial-background-state.json';
import { captureException } from '@sentry/react-native';

const oldState = {
  engine: {
    backgroundState: {
      NetworkController: {
        providerConfig: {
          chainId: '1',
          rpcTarget: 'https://api.avax.network/ext/bc/C/rpc',
        },
        networkDetails: {
          isEIP1559Compatible: true,
        },
        networkConfigurations: {
          network1: {
            chainId: '1',
          },
        },
      },
      AddressBookController: {
        addressBook: {
          1: {
            '0xaddress1': {
              address: '0xaddress1',
              chainId: '1',
              isEns: false,
              memo: 't',
              name: 'test',
            },
            '0xaddress2': {
              address: '0xaddress2',
              chainId: '1',
              isEns: false,
              memo: 't',
              name: 'test2',
            },
          },
        },
      },
      SwapsController: {
        chainCache: {
          1: 'cacheData',
        },
      },
      NftController: {
        allNftContracts: {
          '0xaddress1': {
            1: [{ tokenId: '123', address: '0x1234' }],
          },
        },
        allNfts: {
          '0xaddress1': {
            1: [{ tokenId: '123', address: '0x1234' }],
          },
        },
      },
      TransactionController: {
        transactions: [
          {
            blockNumber: '4916784',
            chainId: '1',
            id: '1',
            networkID: '1',
            status: 'confirmed',
            time: 1702984536000,
            transaction: [{}],
            transactionHash:
              '0x2cb0946f704c288e7448edb3468ff0e75756cb58e66c3c251bb7cb35e5f1108c',
            verifiedOnBlockchain: true,
          },
        ],
      },
    },
  },
  networkOnboarded: {
    networkOnboardedState: {
      1: true,
    },
  },
  swaps: {
    1: {
      data: 'test',
    },
  },
};

const expectedNewState = {
  engine: {
    backgroundState: {
      NetworkController: {
        providerConfig: {
          chainId: '0x1',
          rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
        },
        networkDetails: {
          EIPS: {
            1559: true,
          },
        },
        networkConfigurations: {
          network1: {
            chainId: '0x1',
          },
        },
      },
      AddressBookController: {
        addressBook: {
          '0x1': {
            '0xaddress1': {
              address: '0xaddress1',
              chainId: '0x1',
              isEns: false,
              memo: 't',
              name: 'test',
            },
            '0xaddress2': {
              address: '0xaddress2',
              chainId: '0x1',
              isEns: false,
              memo: 't',
              name: 'test2',
            },
          },
        },
      },
      SwapsController: {
        chainCache: {
          '0x1': 'cacheData',
        },
      },
      NftController: {
        allNftContracts: {
          '0xaddress1': {
            '0x1': [{ tokenId: '123', address: '0x1234' }],
          },
        },
        allNfts: {
          '0xaddress1': {
            '0x1': [{ tokenId: '123', address: '0x1234' }],
          },
        },
      },
      TransactionController: {
        transactions: [
          {
            blockNumber: '4916784',
            chainId: '0x1',
            id: '1',
            networkID: '1',
            status: 'confirmed',
            time: 1702984536000,
            transaction: [{}],
            transactionHash:
              '0x2cb0946f704c288e7448edb3468ff0e75756cb58e66c3c251bb7cb35e5f1108c',
            verifiedOnBlockchain: true,
          },
        ],
      },
    },
  },
  networkOnboarded: {
    networkOnboardedState: {
      '0x1': true,
    },
  },
  swaps: {
    '0x1': {
      data: 'test',
    },
  },
};

jest.mock('@sentry/react-native', () => ({
  captureException: jest.fn(),
}));
const mockedCaptureException = jest.mocked(captureException);

describe('Migration #28', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.resetAllMocks();
  });

  const invalidStates = [
    {
      state: merge({}, initialRootState, {
        engine: null,
      }),
      errorMessage: "Migration 28: Invalid engine state: 'object'",
      scenario: 'engine state is invalid',
    },
    {
      state: merge({}, initialRootState, {
        engine: {
          backgroundState: null,
        },
      }),
      errorMessage: "Migration 28: Invalid engine backgroundState: 'object'",
      scenario: 'backgroundState is invalid',
    },
    {
      state: merge({}, initialRootState, {
        engine: {
          backgroundState: {
            NetworkController: null,
          },
        },
      }),
      errorMessage: "Migration 28: Invalid NetworkController state: 'object'",
      scenario: 'NetworkController state is invalid',
    },
    {
      state: merge({}, initialRootState, {
        engine: {
          backgroundState: {
            NetworkController: { providerConfig: null },
          },
        },
      }),
      errorMessage:
        "Migration 28: Invalid NetworkController providerConfig: 'object'",
      scenario: 'providerConfig is invalid',
    },
    {
      state: merge({}, initialRootState, {
        engine: {
          backgroundState: {
            NetworkController: { providerConfig: { chainId: null } },
          },
        },
      }),
      errorMessage:
        "Migration 28: Invalid NetworkController providerConfig chainId: 'null'",
      scenario: 'chainId is invalid',
    },
    {
      state: merge({}, initialRootState, {
        engine: {
          backgroundState: {
            NetworkController: { networkDetails: null },
          },
        },
      }),
      errorMessage:
        "Migration 28: Invalid NetworkController networkDetails: 'null'",
      scenario: 'networkDetails is invalid',
    },
    {
      state: merge({}, initialRootState, {
        engine: {
          backgroundState: {
            NetworkController: {
              ...initialBackgroundState.NetworkController,
              networkDetails: {
                isEIP1559Compatible: undefined,
              },
            },
          },
        },
      }),
      errorMessage:
        "Migration 28: Invalid NetworkController networkDetails isEIP1559Compatible: 'undefined'",
      scenario: 'networkDetails isEIP1559Compatible is invalid',
    },
    {
      state: merge({}, initialRootState, {
        engine: {
          backgroundState: {
            NetworkController: {
              ...initialBackgroundState.NetworkController,
              networkDetails: {
                isEIP1559Compatible: true,
              },
              networkConfigurations: null,
            },
          },
        },
      }),
      errorMessage:
        "Migration 28: Invalid NetworkController networkConfigurations: 'null'",
      scenario: 'networkConfigurations is invalid',
    },
    {
      state: merge({}, initialRootState, {
        engine: {
          backgroundState: {
            ...initialBackgroundState,
            NetworkController: {
              ...initialBackgroundState.NetworkController,
              networkDetails: {
                isEIP1559Compatible: true,
              },
              networkConfigurations: {},
            },
            AddressBookController: null,
          },
        },
      }),
      errorMessage: "Migration 28: Invalid AddressBookController state: 'null'",
      scenario: 'AddressBookController state is invalid',
    },
    {
      state: merge({}, initialRootState, {
        engine: {
          backgroundState: {
            ...initialBackgroundState,
            NetworkController: {
              ...initialBackgroundState.NetworkController,
              networkDetails: {
                isEIP1559Compatible: true,
              },
              networkConfigurations: {},
            },
            SwapsController: null,
          },
        },
      }),
      errorMessage: "Migration 28: Invalid SwapsController state: 'null'",
      scenario: 'SwapsController state is invalid',
    },
    {
      state: merge({}, initialRootState, {
        engine: {
          backgroundState: {
            ...initialBackgroundState,
            NetworkController: {
              ...initialBackgroundState.NetworkController,
              networkDetails: {
                isEIP1559Compatible: true,
              },
              networkConfigurations: {},
            },
            NftController: null,
          },
        },
      }),
      errorMessage: "Migration 28: Invalid NftController state: 'null'",
      scenario: 'NftController state is invalid',
    },
    {
      state: merge({}, initialRootState, {
        engine: {
          backgroundState: {
            ...initialBackgroundState,
            NetworkController: {
              ...initialBackgroundState.NetworkController,
              networkDetails: {
                isEIP1559Compatible: true,
              },
              networkConfigurations: {},
            },
            TransactionController: null,
          },
        },
      }),
      errorMessage: "Migration 28: Invalid TransactionController state: 'null'",
      scenario: 'TransactionController state is invalid',
    },
  ];

  for (const { errorMessage, scenario, state } of invalidStates) {
    it(`should capture exception if ${scenario}`, () => {
      const newState = migration(state);

      expect(newState).toStrictEqual(state);
      expect(mockedCaptureException).toHaveBeenCalledWith(expect.any(Error));
      expect(mockedCaptureException.mock.calls[0][0].message).toBe(
        errorMessage,
      );
    });
  }

  it('All states changing as expected', () => {
    const newState = migration(oldState);

    expect(newState).toStrictEqual(expectedNewState);
  });
});

import invalidateChannel from './invalidateChannel';
import SDKConnect from '../SDKConnect';
import AppConstants from '../../../core/AppConstants';
import DefaultPreference from 'react-native-default-preference';

jest.mock('../../../core/AppConstants');
jest.mock('../SDKConnect');
jest.mock('react-native-default-preference', () => ({
  set: jest.fn().mockResolvedValue([]),
  get: jest.fn().mockResolvedValue(JSON.stringify({})),
}));

describe('invalidateChannel', () => {
  let mockInstance = {} as unknown as SDKConnect;

  beforeEach(() => {
    jest.clearAllMocks();

    mockInstance = {
      state: {
        disabledHosts: {},
        approvedHosts: {},
        connecting: {},
        connections: {},
      },
    } as unknown as SDKConnect;
  });

  it('should add the host to the disabled hosts list', () => {
    const mockChannelId = 'mockChannelId';
    const mockApprovedUntil = 1234567890;
    const mockHost = AppConstants.MM_SDK.SDK_REMOTE_ORIGIN + mockChannelId;

    mockInstance.state.connections[mockChannelId] = {
      lastAuthorized: mockApprovedUntil,
    } as unknown as SDKConnect['state']['connections'][string];

    invalidateChannel({
      channelId: mockChannelId,
      instance: mockInstance,
    });

    expect(mockInstance.state.disabledHosts[mockHost]).toBe(0);
  });

  it('should remove the host from the approved hosts list', () => {
    const mockChannelId = 'mockChannelId';
    const mockApprovedUntil = 1234567890;
    const mockHost = AppConstants.MM_SDK.SDK_REMOTE_ORIGIN + mockChannelId;

    mockInstance.state.approvedHosts[mockHost] = mockApprovedUntil;
    mockInstance.state.connections[mockChannelId] = {
      lastAuthorized: mockApprovedUntil,
    } as unknown as SDKConnect['state']['connections'][string];

    invalidateChannel({
      channelId: mockChannelId,
      instance: mockInstance,
    });

    expect(mockInstance.state.approvedHosts[mockHost]).toBe(undefined);
  });

  it('should remove the channel from connecting', () => {
    const mockChannelId = 'mockChannelId';
    const mockApprovedUntil = 1234567890;
    const mockHost = AppConstants.MM_SDK.SDK_REMOTE_ORIGIN + mockChannelId;

    mockInstance.state.approvedHosts[mockHost] = mockApprovedUntil;
    mockInstance.state.connections[mockChannelId] = {
      lastAuthorized: mockApprovedUntil,
    } as unknown as SDKConnect['state']['connections'][string];

    invalidateChannel({
      channelId: mockChannelId,
      instance: mockInstance,
    });

    expect(mockInstance.state.connecting[mockChannelId]).toBe(undefined);
  });

  it('should remove the channel from connections', () => {
    const mockChannelId = 'mockChannelId';
    const mockApprovedUntil = 1234567890;
    const mockHost = AppConstants.MM_SDK.SDK_REMOTE_ORIGIN + mockChannelId;

    mockInstance.state.approvedHosts[mockHost] = mockApprovedUntil;
    mockInstance.state.connections[mockChannelId] = {
      lastAuthorized: mockApprovedUntil,
    } as unknown as SDKConnect['state']['connections'][string];

    invalidateChannel({
      channelId: mockChannelId,
      instance: mockInstance,
    });

    expect(mockInstance.state.connections[mockChannelId]).toBe(undefined);
  });

  it('should update the approved hosts list in DefaultPreference', () => {
    const mockChannelId = 'mockChannelId';
    const mockApprovedUntil = 1234567890;
    const mockHost = AppConstants.MM_SDK.SDK_REMOTE_ORIGIN + mockChannelId;

    mockInstance.state.approvedHosts[mockHost] = mockApprovedUntil;
    mockInstance.state.connections[mockChannelId] = {
      lastAuthorized: mockApprovedUntil,
    } as unknown as SDKConnect['state']['connections'][string];

    invalidateChannel({
      channelId: mockChannelId,
      instance: mockInstance,
    });

    expect(DefaultPreference.set).toHaveBeenCalledWith(
      AppConstants.MM_SDK.SDK_APPROVEDHOSTS,
      JSON.stringify(mockInstance.state.approvedHosts),
    );
  });

  it('should update the connections list in DefaultPreference', () => {
    const mockChannelId = 'mockChannelId';
    const mockApprovedUntil = 1234567890;
    const mockHost = AppConstants.MM_SDK.SDK_REMOTE_ORIGIN + mockChannelId;

    mockInstance.state.approvedHosts[mockHost] = mockApprovedUntil;
    mockInstance.state.connections[mockChannelId] = {
      lastAuthorized: mockApprovedUntil,
    } as unknown as SDKConnect['state']['connections'][string];

    invalidateChannel({
      channelId: mockChannelId,
      instance: mockInstance,
    });

    expect(DefaultPreference.set).toHaveBeenCalledWith(
      AppConstants.MM_SDK.SDK_CONNECTIONS,
      JSON.stringify(mockInstance.state.connections),
    );
  });
});

import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import {
  InteractionManager,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  StyleSheet,
  View,
  Alert,
} from 'react-native';
import Modal from 'react-native-modal';
import Share from 'react-native-share';
import QRCode from 'react-native-qrcode-svg';
import EvilIcons from 'react-native-vector-icons/EvilIcons';
import { connect } from 'react-redux';

import Analytics from '../../../core/Analytics/Analytics';
import { MetaMetricsEvents } from '../../../core/Analytics';
import Logger from '../../../util/Logger';
import Device from '../../../util/device';
import { strings } from '../../../../locales/i18n';
import { generateUniversalLinkAddress } from '../../../util/payment-link-generator';
import { getTicker } from '../../../util/transactions';
import { showAlert } from '../../../actions/alert';
import { toggleReceiveModal } from '../../../actions/modals';
import { protectWalletModalVisible } from '../../../actions/user';

import { fontStyles } from '../../../styles/common';
import Text from '../../Base/Text';
import ModalHandler from '../../Base/ModalHandler';
import ModalDragger from '../../Base/ModalDragger';
import AddressQRCode from '../../Views/AddressQRCode';
import EthereumAddress from '../EthereumAddress';
import GlobalAlert from '../GlobalAlert';
import StyledButton from '../StyledButton';
import ClipboardManager from '../../../core/ClipboardManager';
import { ThemeContext, mockTheme } from '../../../util/theme';
import Routes from '../../../constants/navigation/Routes';
import {
  selectChainId,
  selectTicker,
} from '../../../selectors/networkController';
import { isNetworkRampSupported } from '../Ramp/utils';
import { selectSelectedAddress } from '../../../selectors/preferencesController';
import { getRampNetworks } from '../../../reducers/fiatOrders';
import { RequestPaymentModalSelectorsIDs } from '../../../../e2e/selectors/Modals/RequestPaymentModal.selectors';
import { getDecimalChainId } from '../../../util/networks';

const createStyles = (theme) =>
  StyleSheet.create({
    wrapper: {
      backgroundColor: theme.colors.background.default,
      borderTopLeftRadius: 10,
      borderTopRightRadius: 10,
    },
    body: {
      alignItems: 'center',
      paddingHorizontal: 15,
    },
    qrWrapper: {
      margin: 8,
      padding: 8,
      backgroundColor: theme.brandColors.white['000'],
    },
    addressWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      margin: 15,
      padding: 9,
      paddingHorizontal: 15,
      backgroundColor: theme.colors.background.alternative,
      borderRadius: 30,
    },
    copyButton: {
      backgroundColor: theme.colors.background.default,
      color: theme.colors.primary.default,
      borderRadius: 12,
      overflow: 'hidden',
      paddingVertical: 3,
      paddingHorizontal: 6,
      marginHorizontal: 6,
      borderWidth: 1,
      borderColor: theme.colors.primary.default,
    },
    actionRow: {
      flexDirection: 'row',
      marginBottom: 15,
    },
    actionButton: {
      flex: 1,
      marginHorizontal: 8,
    },
    title: {
      ...fontStyles.normal,
      color: theme.colors.text.default,
      fontSize: 18,
      flexDirection: 'row',
      alignSelf: 'center',
    },
    titleWrapper: {
      marginTop: 10,
    },
  });

/**
 * PureComponent that renders receive options
 */
class ReceiveRequest extends PureComponent {
  static propTypes = {
    /**
     * The navigator object
     */
    navigation: PropTypes.object,
    /**
     * Selected address as string
     */
    selectedAddress: PropTypes.string,
    /**
     * Asset to receive, could be not defined
     */
    receiveAsset: PropTypes.object,
    /**
     * Action that toggles the receive modal
     */
    toggleReceiveModal: PropTypes.func,
    /**
		/* Triggers global alert
		*/
    showAlert: PropTypes.func,
    /**
     * Network provider chain id
     */
    chainId: PropTypes.string,
    /**
     * Native asset ticker
     */
    ticker: PropTypes.string,
    /**
     * Prompts protect wallet modal
     */
    protectWalletModalVisible: PropTypes.func,
    /**
     * Hides the modal that contains the component
     */
    hideModal: PropTypes.func,
    /**
     * redux flag that indicates if the user
     * completed the seed phrase backup flow
     */
    seedphraseBackedUp: PropTypes.bool,
    /**
     * Boolean that indicates if the network supports buy
     */
    isNetworkBuySupported: PropTypes.bool,
  };

  state = {
    qrModalVisible: false,
    buyModalVisible: false,
  };

  /**
   * Share current account public address
   */
  onShare = () => {
    const { selectedAddress } = this.props;
    Share.open({
      message: generateUniversalLinkAddress(selectedAddress),
    })
      .then(() => {
        this.props.hideModal();
        setTimeout(() => this.props.protectWalletModalVisible(), 1000);
      })
      .catch((err) => {
        Logger.log('Error while trying to share address', err);
      });
    InteractionManager.runAfterInteractions(() => {
      Analytics.trackEvent(MetaMetricsEvents.RECEIVE_OPTIONS_SHARE_ADDRESS);
    });
  };

  /**
   * Shows an alert message with a coming soon message
   */
  onBuy = async () => {
    const { navigation, toggleReceiveModal, isNetworkBuySupported } =
      this.props;
    if (!isNetworkBuySupported) {
      Alert.alert(
        strings('fiat_on_ramp.network_not_supported'),
        strings('fiat_on_ramp.switch_network'),
      );
    } else {
      toggleReceiveModal();
      navigation.navigate(Routes.RAMP.BUY);
      InteractionManager.runAfterInteractions(() => {
        Analytics.trackEventWithParameters(
          MetaMetricsEvents.BUY_BUTTON_CLICKED,
          {
            text: 'Buy Native Token',
            location: 'Receive Modal',
            chain_id_destination: getDecimalChainId(this.props.chainId),
          },
        );
      });
    }
  };

  copyAccountToClipboard = async () => {
    const { selectedAddress } = this.props;
    ClipboardManager.setString(selectedAddress);
    this.props.showAlert({
      isVisible: true,
      autodismiss: 1500,
      content: 'clipboard-alert',
      data: { msg: strings('account_details.account_copied_to_clipboard') },
    });
    if (!this.props.seedphraseBackedUp) {
      setTimeout(() => this.props.hideModal(), 1000);
      setTimeout(() => this.props.protectWalletModalVisible(), 1500);
    }
  };

  /**
   * Closes QR code modal
   */
  closeQrModal = (toggleModal) => {
    this.props.hideModal();
    toggleModal();
  };

  /**
   * Opens QR code modal
   */
  openQrModal = () => {
    this.setState({ qrModalVisible: true });
    InteractionManager.runAfterInteractions(() => {
      Analytics.trackEvent(MetaMetricsEvents.RECEIVE_OPTIONS_QR_CODE);
    });
  };

  onReceive = () => {
    this.props.toggleReceiveModal();
    this.props.navigation.navigate('PaymentRequestView', {
      screen: 'PaymentRequest',
      params: { receiveAsset: this.props.receiveAsset },
    });
    InteractionManager.runAfterInteractions(() => {
      Analytics.trackEvent(MetaMetricsEvents.RECEIVE_OPTIONS_PAYMENT_REQUEST);
    });
  };

  render() {
    const theme = this.context || mockTheme;
    const colors = theme.colors;
    const styles = createStyles(theme);

    return (
      <SafeAreaView style={styles.wrapper}>
        <ModalDragger />
        <View style={styles.titleWrapper}>
          <Text
            style={styles.title}
            testID={RequestPaymentModalSelectorsIDs.CONTAINER}
          >
            {strings('receive_request.title')}
          </Text>
        </View>
        <View style={styles.body}>
          <ModalHandler>
            {({ isVisible, toggleModal }) => (
              <>
                <TouchableOpacity
                  style={styles.qrWrapper}
                  // eslint-disable-next-line react/jsx-no-bind
                  onPress={() => {
                    toggleModal();
                    InteractionManager.runAfterInteractions(() => {
                      Analytics.trackEvent(
                        MetaMetricsEvents.RECEIVE_OPTIONS_QR_CODE,
                      );
                    });
                  }}
                >
                  <QRCode
                    value={`ethereum:${this.props.selectedAddress}@${this.props.chainId}`}
                    size={Dimensions.get('window').width / 2}
                  />
                </TouchableOpacity>
                <Modal
                  isVisible={isVisible}
                  onBackdropPress={toggleModal}
                  onBackButtonPress={toggleModal}
                  onSwipeComplete={toggleModal}
                  swipeDirection={'down'}
                  propagateSwipe
                  testID={RequestPaymentModalSelectorsIDs.QR_MODAL}
                  backdropColor={colors.overlay.default}
                  backdropOpacity={1}
                >
                  <AddressQRCode
                    closeQrModal={() => this.closeQrModal(toggleModal)}
                  />
                </Modal>
              </>
            )}
          </ModalHandler>

          <Text>{strings('receive_request.scan_address')}</Text>

          <TouchableOpacity
            style={styles.addressWrapper}
            onPress={this.copyAccountToClipboard}
            testID={RequestPaymentModalSelectorsIDs.ACCOUNT_ADDRESS}
          >
            <Text>
              <EthereumAddress
                address={this.props.selectedAddress}
                type={'short'}
              />
            </Text>
            <Text style={styles.copyButton} small>
              {strings('receive_request.copy')}
            </Text>
            <TouchableOpacity onPress={this.onShare}>
              <EvilIcons
                name={Device.isIos() ? 'share-apple' : 'share-google'}
                size={25}
                color={colors.primary.default}
              />
            </TouchableOpacity>
          </TouchableOpacity>
          <View style={styles.actionRow}>
            {this.props.isNetworkBuySupported && (
              <StyledButton
                type={'blue'}
                containerStyle={styles.actionButton}
                onPress={this.onBuy}
              >
                {strings('fiat_on_ramp.buy', {
                  ticker: getTicker(this.props.ticker),
                })}
              </StyledButton>
            )}
            <StyledButton
              type={'normal'}
              onPress={this.onReceive}
              containerStyle={styles.actionButton}
              testID={RequestPaymentModalSelectorsIDs.REQUEST_BUTTON}
            >
              {strings('receive_request.request_payment')}
            </StyledButton>
          </View>
        </View>

        <GlobalAlert />
      </SafeAreaView>
    );
  }
}

ReceiveRequest.contextType = ThemeContext;

const mapStateToProps = (state) => ({
  chainId: selectChainId(state),
  ticker: selectTicker(state),
  selectedAddress: selectSelectedAddress(state),
  receiveAsset: state.modals.receiveAsset,
  seedphraseBackedUp: state.user.seedphraseBackedUp,
  isNetworkBuySupported: isNetworkRampSupported(
    selectChainId(state),
    getRampNetworks(state),
  ),
});

const mapDispatchToProps = (dispatch) => ({
  toggleReceiveModal: () => dispatch(toggleReceiveModal()),
  showAlert: (config) => dispatch(showAlert(config)),
  protectWalletModalVisible: () => dispatch(protectWalletModalVisible()),
});

export default connect(mapStateToProps, mapDispatchToProps)(ReceiveRequest);

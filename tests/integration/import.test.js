import {
  HDSegwitElectrumSeedP2WPKHWallet,
  HDLegacyBreadwalletWallet,
  HDSegwitBech32Wallet,
  HDLegacyElectrumSeedP2PKHWallet,
  LegacyWallet,
  SegwitP2SHWallet,
  SegwitBech32Wallet,
  HDLegacyP2PKHWallet,
  HDSegwitP2SHWallet,
  WatchOnlyWallet,
  HDAezeedWallet,
  SLIP39SegwitP2SHWallet,
  SLIP39SegwitBech32Wallet,
} from '../../class';
import startImport, { discoverBIP39WithCustomDerivationPath } from '../../class/wallet-import';
const assert = require('assert');

global.net = require('net'); // needed by Electrum client. For RN it is proviced in shim.js
global.tls = require('tls'); // needed by Electrum client. For RN it is proviced in shim.js
const BlueElectrum = require('../../blue_modules/BlueElectrum'); // so it connects ASAP

jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000;

afterAll(async () => {
  // after all tests we close socket so the test suite can actually terminate
  BlueElectrum.forceDisconnect();
});

beforeAll(async () => {
  // awaiting for Electrum to be connected. For RN Electrum would naturally connect
  // while app starts up, but for tests we need to wait for it
  await BlueElectrum.waitTillConnected();
});

const createStore = password => {
  const state = { wallets: [] };
  const history = [];

  const onProgress = data => {
    history.push({ action: 'progress', data });
    state.progress = data;
  };

  const onWallet = data => {
    history.push({ action: 'wallet', data });
    state.wallets.push(data);
  };

  const onPassword = () => {
    history.push({ action: 'password', data: password });
    state.password = password;
    return password;
  };

  return {
    state,
    history,
    callbacks: { onProgress, onWallet, onPassword },
  };
};

describe('import procedure', () => {
  it('can be cancelled', async () => {
    // returns undefined on first call, throws cancel exception on second
    let flag = false;
    const onPassword = async () => {
      if (flag) throw new Error('Cancel Pressed');
      flag = true;
      return undefined;
    };
    const store = createStore();
    const imprt = await startImport('6PnU5voARjBBykwSddwCdcn6Eu9EcsK24Gs5zWxbJbPZYW7eiYQP8XgKbN', { ...store.callbacks, onPassword });
    assert.strictEqual(store.state.wallets.length, 0);
    assert.strictEqual(imprt.cancelled, true);
  });

  it('can import multiple wallets', async () => {
    const store = createStore();
    await startImport('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about', store.callbacks);
    assert.strictEqual(store.state.wallets.length > 3, true);
  });

  it('can import BIP84', async () => {
    const store = createStore();
    await startImport(
      'always direct find escape liar turn differ shy tool gap elder galaxy lawn wild movie fog moon spread casual inner box diagram outdoor tell',
      store.callbacks,
    );
    assert.strictEqual(store.state.wallets[0].type, HDSegwitBech32Wallet.type);
    assert.strictEqual(store.state.wallets[0]._getExternalAddressByIndex(0), 'bc1qth9qxvwvdthqmkl6x586ukkq8zvumd38nxr08l');
  });

  it('can import BIP84 with passphrase', async () => {
    const store = createStore('BlueWallet');
    await startImport('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about', store.callbacks);
    assert.strictEqual(store.state.wallets[0].type, HDSegwitBech32Wallet.type);
    assert.strictEqual(store.state.wallets[0]._getExternalAddressByIndex(0), 'bc1qe8q660wfj6uvqg7zyn86jcsux36natklqnfdrc');
  });

  it('can import Legacy', async () => {
    const store = createStore();
    await startImport('KztVRmc2EJJBHi599mCdXrxMTsNsGy3NUjc3Fb3FFDSMYyMDRjnv', store.callbacks);
    assert.strictEqual(store.state.wallets[0].type, LegacyWallet.type);
    assert.strictEqual(store.state.wallets[0].getAddress(), '1AhcdMCzby4VXgqrexuMfh7eiSprRFtN78');
  });

  it('can import Legacy P2SH Segwit', async () => {
    const store = createStore();
    await startImport('L3NxFnYoBGjJ5PhxrxV6jorvjnc8cerYJx71vXU6ta8BXQxHVZya', store.callbacks);
    assert.strictEqual(store.state.wallets[0].type, SegwitP2SHWallet.type);
    assert.strictEqual(store.state.wallets[0].getAddress(), '3KM9VfdsDf9uT7uwZagoKgVn8z35m9CtSM');
  });

  it('can import Legacy Bech32 Segwit', async () => {
    const store = createStore();
    await startImport('L1T6FfKpKHi8JE6eBKrsXkenw34d5FfFzJUZ6dLs2utxkSvsDfxZ', store.callbacks);
    assert.strictEqual(store.state.wallets[0].type, SegwitBech32Wallet.type);
    assert.strictEqual(store.state.wallets[0].getAddress(), 'bc1q763rf54hzuncmf8dtlz558uqe4f247mq39rjvr');
  });

  it('can import BIP44', async () => {
    const store = createStore();
    await startImport(
      'sting museum endless duty nice riot because swallow brother depth weapon merge woman wish hold finish venture gauge stomach bomb device bracket agent parent',
      store.callbacks,
    );
    assert.strictEqual(store.state.wallets[0].type, HDLegacyP2PKHWallet.type);
    assert.strictEqual(store.state.wallets[0]._getExternalAddressByIndex(0), '1EgDbwf5nXp9knoaWW6nV6N91EK3EFQ5vC');
  });

  it('can import BIP49', async () => {
    const store = createStore();
    await startImport(
      'believe torch sport lizard absurd retreat scale layer song pen clump combine window staff dream filter latin bicycle vapor anchor put clean gain slush',
      store.callbacks,
    );
    assert.strictEqual(store.state.wallets[0].type, HDSegwitP2SHWallet.type);
    assert.strictEqual(store.state.wallets[0]._getExternalAddressByIndex(0), '3EoqYYp7hQSHn5nHqRtWzkgqmK3caQ2SUu');
  });

  it('can import HD Legacy Electrum (BIP32 P2PKH)', async () => {
    const store = createStore();
    await startImport('eight derive blast guide smoke piece coral burden lottery flower tomato flame', store.callbacks);
    assert.strictEqual(store.state.wallets[0].type, HDLegacyElectrumSeedP2PKHWallet.type);
    assert.strictEqual(store.state.wallets[0]._getExternalAddressByIndex(0), '1FgVfJ5D3HyKWKC4xk36Cio7MUaxxnXaVd');
  });

  it('can import HD Legacy Electrum (BIP32 P2PKH) with passphrase', async () => {
    const store = createStore('super secret passphrase');
    await startImport('receive happy wash prosper update pet neck acid try profit proud hungry', store.callbacks);
    assert.strictEqual(store.state.wallets[0].type, HDLegacyElectrumSeedP2PKHWallet.type);
    assert.strictEqual(store.state.wallets[0]._getExternalAddressByIndex(0), '13sPvsrgRN8XibZNHtZXNqVDJPnNZLjTap');
  });

  it('can import BreadWallet', async () => {
    const store = createStore();
    await startImport('become salmon motor battle sweet merit romance ecology age squirrel oblige awesome', store.callbacks);
    assert.strictEqual(store.state.wallets[0].type, HDLegacyBreadwalletWallet.type);
    assert.strictEqual(store.state.wallets[0]._getExternalAddressByIndex(0), '1G5tkEuWWirz8AFyzrafSgFxvKsRwcBqwY');
    assert.strictEqual(store.state.wallets[0]._getExternalAddressByIndex(1), 'bc1q5gslp44fkfdkq6r255utxpq85c9n02m3hsla68');
  });

  it('can import HD Electrum (BIP32 P2WPKH)', async () => {
    const store = createStore();
    await startImport('noble mimic pipe merry knife screen enter dune crop bonus slice card', store.callbacks);
    assert.strictEqual(store.state.wallets[0].type, HDSegwitElectrumSeedP2WPKHWallet.type);
    assert.strictEqual(store.state.wallets[0]._getExternalAddressByIndex(0), 'bc1qzzanxnr3xv9a5ha264kpzpfq260qvuameslddu');
  });

  it('can import HD Electrum (BIP32 P2WPKH) with passphrase', async () => {
    const UNICODE_HORROR = '₿ 😀 😈     う けたま わる w͢͢͝h͡o͢͡ ̸͢k̵͟n̴͘ǫw̸̛s͘ ̀́w͘͢ḩ̵a҉̡͢t ̧̕h́o̵r͏̵rors̡ ̶͡͠lį̶e͟͟ ̶͝in͢ ͏t̕h̷̡͟e ͟͟d̛a͜r̕͡k̢̨ ͡h̴e͏a̷̢̡rt́͏ ̴̷͠ò̵̶f̸ u̧͘ní̛͜c͢͏o̷͏d̸͢e̡͝?͞';
    const store = createStore(UNICODE_HORROR);
    await startImport('bitter grass shiver impose acquire brush forget axis eager alone wine silver', store.callbacks);
    assert.strictEqual(store.state.wallets[0].type, HDSegwitElectrumSeedP2WPKHWallet.type);
    assert.strictEqual(store.state.wallets[0]._getExternalAddressByIndex(0), 'bc1qx94dutas7ysn2my645cyttujrms5d9p57f6aam');
  });

  it('can import AEZEED', async () => {
    const store = createStore();
    await startImport(
      'abstract rhythm weird food attract treat mosquito sight royal actor surround ride strike remove guilt catch filter summer mushroom protect poverty cruel chaos pattern',
      store.callbacks,
    );
    assert.strictEqual(store.state.wallets[0].type, HDAezeedWallet.type);
  });

  it('can import AEZEED with password', async () => {
    const store = createStore('strongPassword');
    await startImport(
      'able mix price funny host express lawsuit congress antique float pig exchange vapor drip wide cup style apple tumble verb fix blush tongue market',
      store.callbacks,
    );
    assert.strictEqual(store.state.wallets[0].type, HDAezeedWallet.type);
  });

  it('importing empty BIP39 should yield BIP84', async () => {
    const store = createStore();
    const tempWallet = new HDSegwitBech32Wallet();
    await tempWallet.generate();
    await startImport(tempWallet.getSecret(), store.callbacks);
    assert.strictEqual(store.state.wallets[0].type, HDSegwitBech32Wallet.type);
  });

  it('can import Legacy with uncompressed pubkey', async () => {
    const store = createStore();
    await startImport('5KE6tf9vhYkzYSbgEL6M7xvkY69GMFHF3WxzYaCFMvwMxn3QgRS', store.callbacks);
    assert.strictEqual(store.state.wallets[0].getSecret(), '5KE6tf9vhYkzYSbgEL6M7xvkY69GMFHF3WxzYaCFMvwMxn3QgRS');
    assert.strictEqual(store.state.wallets[0].type, LegacyWallet.type);
    assert.strictEqual(store.state.wallets[0].getAddress(), '1GsJDeD6fqS912egpjhdjrUTiCh1hhwBgQ');
  });

  it('can import BIP38 encrypted backup', async () => {
    const store = createStore('qwerty');
    await startImport('6PnU5voARjBBykwSddwCdcn6Eu9EcsK24Gs5zWxbJbPZYW7eiYQP8XgKbN', store.callbacks);
    assert.strictEqual(store.state.wallets[0].getSecret(), 'KxqRtpd9vFju297ACPKHrGkgXuberTveZPXbRDiQ3MXZycSQYtjc');
    assert.strictEqual(store.state.wallets[0].type, LegacyWallet.type);
    assert.strictEqual(store.state.wallets[0].getAddress(), '1639W2kM6UY9PdavMQeLqG4SuUEae9NZfq');
  });

  it('can import watch-only address', async () => {
    const store1 = createStore();
    await startImport('1AhcdMCzby4VXgqrexuMfh7eiSprRFtN78', store1.callbacks);
    assert.strictEqual(store1.state.wallets[0].type, WatchOnlyWallet.type);

    const store2 = createStore();
    await startImport('3EoqYYp7hQSHn5nHqRtWzkgqmK3caQ2SUu', store2.callbacks);
    assert.strictEqual(store2.state.wallets[0].type, WatchOnlyWallet.type);

    const store3 = createStore();
    await startImport('bc1q8j4lk4qlhun0n7h5ahfslfldc8zhlxgynfpdj2', store3.callbacks);
    assert.strictEqual(store3.state.wallets[0].type, WatchOnlyWallet.type);

    const store4 = createStore();
    await startImport(
      'zpub6r7jhKKm7BAVx3b3nSnuadY1WnshZYkhK8gKFoRLwK9rF3Mzv28BrGcCGA3ugGtawi1WLb2vyjQAX9ZTDGU5gNk2bLdTc3iEXr6tzR1ipNP',
      store4.callbacks,
    );
    assert.strictEqual(store4.state.wallets[0].type, WatchOnlyWallet.type);
  });

  it('can import slip39 wallet', async () => {
    const store = createStore();
    // 2-of-3 slip39 wallet
    // crystal lungs academic acid corner infant satisfy spider alcohol laser golden equation fiscal epidemic infant scholar space findings tadpole belong
    // crystal lungs academic agency class payment actress avoid rebound ordinary exchange petition tendency mild mobile spine robin fancy shelter increase
    // crystal lungs academic always earth satoshi elbow satoshi that pants formal leaf rival texture romantic filter expand regular soul desert
    await startImport(
      'crystal lungs academic acid corner infant satisfy spider alcohol laser golden equation fiscal epidemic infant scholar space findings tadpole belong\n' +
        'crystal lungs academic agency class payment actress avoid rebound ordinary exchange petition tendency mild mobile spine robin fancy shelter increase',
      store.callbacks,
    );
    assert.strictEqual(store.state.wallets[0].type, SLIP39SegwitP2SHWallet.type);
  });

  it('can import slip39 wallet with password', async () => {
    const store = createStore('BlueWallet');
    // 2-of-3 slip39 wallet
    // crystal lungs academic acid corner infant satisfy spider alcohol laser golden equation fiscal epidemic infant scholar space findings tadpole belong
    // crystal lungs academic agency class payment actress avoid rebound ordinary exchange petition tendency mild mobile spine robin fancy shelter increase
    // crystal lungs academic always earth satoshi elbow satoshi that pants formal leaf rival texture romantic filter expand regular soul desert
    await startImport(
      'crystal lungs academic acid corner infant satisfy spider alcohol laser golden equation fiscal epidemic infant scholar space findings tadpole belong\n' +
        'crystal lungs academic agency class payment actress avoid rebound ordinary exchange petition tendency mild mobile spine robin fancy shelter increase',
      store.callbacks,
    );
    assert.strictEqual(store.state.wallets[0].type, SLIP39SegwitBech32Wallet.type);
    assert.strictEqual(store.state.wallets[0]._getExternalAddressByIndex(0), 'bc1q5k23fle53w8a3982m82e9f6hqlnrh3mv5s9s6z');
  });

  it('can import watch-only Cobo vault export', async () => {
    const store = createStore();
    await startImport(
      '{"ExtPubKey":"zpub6riZchHnrWzhhZ3Z4dhCJmesGyafMmZBRC9txhnidR313XJbcv4KiDubderKHhL7rMsqacYd82FQ38e4whgs8Dg7CpsxX3dSGWayXsEerF4","MasterFingerprint":"7D2F0272","AccountKeyPath":"84\'\\/0\'\\/0\'","CoboVaultFirmwareVersion":"2.6.1(BTC-Only)"}',
      store.callbacks,
    );
    assert.strictEqual(store.state.wallets[0].type, WatchOnlyWallet.type);
  });
});

describe('bip39 discover', () => {
  it.only('can discover wallets by derivation path', async () => {
    const wallets = await discoverBIP39WithCustomDerivationPath(
      'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
      undefined,
      "m/44'/0'/1'",
    );

    assert.strictEqual(wallets[HDLegacyP2PKHWallet.type].wallet.type, HDLegacyP2PKHWallet.type);
    assert.strictEqual(wallets[HDLegacyP2PKHWallet.type].wallet.getDerivationPath(), "m/44'/0'/1'");
    assert.strictEqual(wallets[HDSegwitP2SHWallet.type].wallet.type, HDSegwitP2SHWallet.type);
    assert.strictEqual(wallets[HDSegwitP2SHWallet.type].wallet.getDerivationPath(), "m/44'/0'/1'");
    assert.strictEqual(wallets[HDSegwitBech32Wallet.type].wallet.type, HDSegwitBech32Wallet.type);
    assert.strictEqual(wallets[HDSegwitBech32Wallet.type].wallet.getDerivationPath(), "m/44'/0'/1'");
  });
});

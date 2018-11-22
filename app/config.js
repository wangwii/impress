import R from 'ramda';
import Dotenv from 'dotenv';

const conf = Dotenv.config();

const defaults = Object.assign({
  host: '0.0.0.0',
  port: 3000,
  appkey: '',
  appsecret: '',
  corpid: '',
  corpsecret: '',
  oapiHost: 'https://oapi.dingtalk.com'
}, conf.parsed || {});

const hasKey = R.has(R.__, process.env);
Object.keys(defaults).forEach((key) => {
  if (hasKey(key)) {
    defaults[key] = process.env[key]
  }
});

module.exports = {
  get: (key) => {
    return R.isNil(key) ? defaults : defaults[key];
  },
  getAKs: () => {
    const { appkey, appsecret } = defaults;
    return { appkey, appsecret };
  },
  getCKs: () => {
    const { corpid, corpsecret } = defaults;
    return { corpid, corpsecret };
  },
  getApiHost: () => {
    return defaults['oapiHost'];
  }
}

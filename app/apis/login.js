import R from 'ramda';
import req from 'superagent';

import { Observable } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';

import config from '../config';

const uriOf = (path) => `${config.getApiHost()}${path}`;

const getToken = Observable.create((observer) => {
  console.log('Fetching Access Token....');

  const fn = (body) => body.errcode > 0 ? observer.error(body) : observer.next(body);
  req.get(uriOf('/gettoken'))
    .query(config.getCKs())
    .end((err, res) => err ? observer.error(err) : fn(res.body));
});

const getUserId = R.curry((code, { access_token }) => {
  console.log('Fetching UserId by access_token=%s, authCode: %s', access_token, code)

  return Observable.create((observer) => {
    const fn = (body) => body.errcode > 0
      ? observer.error(body)
      : observer.next(Object.assign(body, { access_token }));

    req.get(uriOf('/user/getuserinfo'))
      .query({ access_token, code })
      .end((err, res) => err ? observer.error(err) : fn(res.body));
  });
});

const getUserInfo = ({ userid, access_token }) => {
  console.log('Fetching UserInfo by access_token=%s, userid: %s', access_token, userid);
  return Observable.create((observer) => {
    const fn = (body) => body.errcode > 0
      ? observer.error(body)
      : observer.next(Object.assign(body, { access_token }));

    req.get(uriOf('/user/get'))
      .query({ access_token, userid })
      .end((err, res) => err ? observer.error(err) : fn(res.body));
  });
}

const getUsersOfDepartment = (body) => {
  const { access_token, unionid, userid, name, avatar } = body;
  const [department, offset, size] = [body.department[0], 0, 100];
  console.log('Fetching Users for department:', department);

  const user = { unionid, userid, name, avatar, department };
  return Observable.create((observer) => {
    const fn = (body) => body.errcode > 0
      ? observer.error(body)
      : observer.next(Object.assign(body, { user }));

    req.get(uriOf('/user/listbypage'))
      .query({ access_token, size, offset, department_id: department })
      .end((err, res) => err ? observer.error(err) : fn(res.body));
  });
}

export default (req, res) => {
  const onError = (err) => {
    console.log('Got Error ------>:');
    console.log(err);
    console.log('---------------->');
    res.status(500).json({ error: err })
  }

  const onResponse = (dat) => {
    const { userlist, user } = dat;
    const pickUserInfo = R.pick(Object.keys(user));
    const excludeCurrentUser = (u)=> u.unionid !== user.unionid;

    const users = [user].concat(userlist.filter(excludeCurrentUser).map(pickUserInfo));
    res.json({ user, users, errcode: 0, errmsg: 'ok' });
  }

  const getUserIdWithCode = getUserId(req.body.auth_code);
  getToken.pipe(
    // tap(d => console.log('Got Token:', d)),
    switchMap(getUserIdWithCode),
    // tap(d => console.log('Got UserId:', d)),
    switchMap(getUserInfo),
    // tap(d => console.log('Got UserInfo:', d)),
    switchMap(getUsersOfDepartment),
    // tap(d => console.log('Got Users of Department:', d)),
  ).subscribe(onResponse, onError);
};

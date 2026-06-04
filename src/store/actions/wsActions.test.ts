import * as types from './index';
import { WSMaintenanceAction, WSReconnectedAction, WSUserAvatarAction } from './wsActions';

describe('WSUserAvatarAction', () => {
  it('should create WS_USER_AVATAR action with pk and avatar', () => {
    const pk = 123;
    const avatar = 'avatar.png';

    const action = WSUserAvatarAction(pk, avatar);

    expect(action).toEqual({
      type: types.WS_USER_AVATAR,
      pk,
      avatar,
    });
  });
});

describe('WSMaintenanceAction', () => {
  it('should create WS_MAINTENANCE action with maintenance boolean', () => {
    const maintenance = true;

    const action = WSMaintenanceAction(maintenance);

    expect(action).toEqual({
      type: types.WS_MAINTENANCE,
      maintenance,
    });
  });
});

describe('WSReconnectedAction', () => {
  it('should create WS_RECONNECTED action', () => {
    const action = WSReconnectedAction();
    expect(action).toEqual({ type: types.WS_RECONNECTED });
  });
});

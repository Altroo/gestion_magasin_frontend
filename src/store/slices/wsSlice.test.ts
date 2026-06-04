import reducer, {setWSMaintenance} from './wsSlice';

describe('wsSlice reducer', () => {
  it('should return the initial state when passed an empty action', () => {
    const result = reducer(undefined, {type: ''});
    expect(result).toEqual({
      maintenance: false,
    });
  });

  it('should handle setWSMaintenance', () => {
    const result = reducer(undefined, setWSMaintenance(true));
    expect(result).toEqual({
      maintenance: true,
    });
  });
});

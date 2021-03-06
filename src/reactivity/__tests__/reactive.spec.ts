import { reactive, isReactive, toRaw } from '../reactive';
import { mutation } from '../lock';
import { mockWarn } from '../../test-utils/mockWarn';

describe('reactivity/reactive', () => {
  mockWarn();

  test('Object', () => {
    const original = { foo: 1 };
    const observed = reactive(original);
    expect(observed).not.toBe(original);
    expect(isReactive(observed)).toBe(true);
    expect(isReactive(original)).toBe(false);
    // get
    expect(observed.foo).toBe(1);
    // has
    expect('foo' in observed).toBe(true);
    // ownKeys
    expect(Object.keys(observed)).toEqual(['foo']);
  });

  test('Array', () => {
    const original = [{ foo: 1 }];
    const observed = reactive(original);
    expect(observed).not.toBe(original);
    expect(isReactive(observed)).toBe(true);
    expect(isReactive(original)).toBe(false);
    expect(isReactive(observed[0])).toBe(true);
    // get
    expect(observed[0].foo).toBe(1);
    // has
    expect(0 in observed).toBe(true);
    // ownKeys
    expect(Object.keys(observed)).toEqual(['0']);
  });

  test('should not set or delete value if object locked', () => {
    const original: any = { foo: 1 };
    const observed = reactive(original);

    expect(() => {
      observed.bar = 1;
    }).toThrowError(
      /Cannot set key: bar, hookux state is readonly except in coresponding reducer./
    );

    expect(() => {
      delete observed.foo;
    }).toThrowError(
      /Cannot delete key: foo, hookux state is readonly except in coresponding reducer./
    );
  });

  test('cloned reactive Array should point to observed values', () => {
    const original = [{ foo: 1 }];
    const observed = reactive(original);
    const clone = observed.slice();
    expect(isReactive(clone[0])).toBe(true);
    expect(clone[0]).not.toBe(original[0]);
    expect(clone[0]).toBe(observed[0]);
  });

  test('nested reactives', () => {
    const original = {
      nested: {
        foo: 1
      },
      array: [{ bar: 2 }]
    };
    const observed = reactive(original);
    expect(isReactive(observed.nested)).toBe(true);
    expect(isReactive(observed.array)).toBe(true);
    expect(isReactive(observed.array[0])).toBe(true);
  });

  test('observed value should proxy mutations to original (Object)', () => {
    const original: any = { foo: 1 };
    const observed = reactive(original);
    // set
    mutation(() => {
      observed.bar = 1;
    });
    expect(observed.bar).toBe(1);
    expect(original.bar).toBe(1);

    // delete
    mutation(() => {
      delete observed.foo;
    });
    expect('foo' in observed).toBe(false);
    expect('foo' in original).toBe(false);
  });

  test('observed value should proxy mutations to original (Array)', () => {
    const original: any[] = [{ foo: 1 }, { bar: 2 }];
    const observed = reactive(original);
    // set
    const value = { baz: 3 };
    const reactiveValue = reactive(value);
    mutation(() => {
      observed[0] = value;
    });
    expect(observed[0]).toBe(reactiveValue);
    expect(original[0]).toBe(value);
    // delete
    mutation(() => {
      delete observed[0];
    });
    expect(observed[0]).toBeUndefined();
    expect(original[0]).toBeUndefined();
    // mutating methods
    mutation(() => {
      observed.push(value);
    });
    expect(observed[2]).toBe(reactiveValue);
    expect(original[2]).toBe(value);
  });

  test('setting a property with an unobserved value should wrap with reactive', () => {
    const observed = reactive<{ foo?: object }>({});
    const raw = {};

    mutation(() => {
      observed.foo = raw;
    });

    expect(observed.foo).not.toBe(raw);
    expect(isReactive(observed.foo)).toBe(true);
  });

  test('observing already observed value should return same Proxy', () => {
    const original = { foo: 1 };
    const observed = reactive(original);
    const observed2 = reactive(observed);
    expect(observed2).toBe(observed);
  });

  test('observing the same value multiple times should return same Proxy', () => {
    const original = { foo: 1 };
    const observed = reactive(original);
    const observed2 = reactive(original);
    expect(observed2).toBe(observed);
  });

  test('should not pollute original object with Proxies', () => {
    const original: any = { foo: 1 };
    const original2 = { bar: 2 };
    const observed = reactive(original);
    const observed2 = reactive(original2);
    mutation(() => {
      observed.bar = observed2;
    });
    expect(observed.bar).toBe(observed2);
    expect(original.bar).toBe(original2);
  });

  test('unwrap', () => {
    const original = { foo: 1 };
    const observed = reactive(original);
    expect(toRaw(observed)).toBe(original);
    expect(toRaw(original)).toBe(original);
  });

  // test('should not unwrap Ref<T>', () => {
  //   const observedNumberRef = reactive(ref(1))
  //   const observedObjectRef = reactive(ref({ foo: 1 }))

  //   expect(isRef(observedNumberRef)).toBe(true)
  //   expect(isRef(observedObjectRef)).toBe(true)
  // })

  // test('should unwrap computed refs', () => {
  //   // readonly
  //   const a = computed(() => 1)
  //   // writable
  //   const b = computed({
  //     get: () => 1,
  //     set: () => {}
  //   })
  //   const obj = reactive({ a, b })
  //   // check type
  //   obj.a + 1
  //   obj.b + 1
  //   expect(typeof obj.a).toBe(`number`)
  //   expect(typeof obj.b).toBe(`number`)
  // })

  test('non-observable values', () => {
    const assertValue = (value: any): void => {
      reactive(value);
      expect(`value cannot be made reactive: ${String(value)}`).toHaveBeenWarnedLast();
    };

    // number
    assertValue(1);
    // string
    assertValue('foo');
    // boolean
    assertValue(false);
    // null
    assertValue(null);
    // undefined
    assertValue(undefined);
    // symbol
    const s = Symbol();
    assertValue(s);

    // built-ins should work and return same value
    const p = Promise.resolve();
    expect(reactive(p)).toBe(p);
    const r = new RegExp('');
    expect(reactive(r)).toBe(r);
    const d = new Date();
    expect(reactive(d)).toBe(d);
  });
});

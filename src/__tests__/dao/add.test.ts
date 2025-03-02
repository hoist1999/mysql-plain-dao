// use a very simple test to check the test environment
describe('Basic Math Operations', () => {
    test('adds 1 + 1 to equal 2', () => {
        expect(1 + 1).toBe(2);
    });

    test('1 + 1 should not equal 3', () => {
        expect(1 + 1).not.toBe(3);
    });
}); 
const assert = require("assert")

class EventsTester {
    handlerGenerator(number) {
        return () => {
            this[`handler${number}`] = true
        }
    }
}

describe("test broker.js", function() {
    let failed = true

    it("preliminary test on module exports", function() {
        const broker = require("../broker.js")

        assert.strictEqual(typeof broker.emit, "function")
        assert.strictEqual(broker.emit.length, 1)
        assert.strictEqual(typeof broker.subscribe, "function")
        assert.strictEqual(broker.subscribe.length, 2)
        assert.strictEqual(typeof broker.unsubscribe, "function")
        assert.strictEqual(broker.unsubscribe.length, 2)

        failed = false
    })

    describe("test correctness", function() {
        before("skip if the module test failed", function() {
            if (failed)
                this.skip()
        })

        beforeEach(function() {
            delete require.cache["../broker.js"]
        })

        it("simple test", function() {
            const broker = require("../broker.js")

            const events = new EventsTester()
            const handler1 = events.handlerGenerator(1)
            const handler2 = events.handlerGenerator(2)

            broker.subscribe("event1", handler1)
            broker.subscribe("event2", handler2)
            broker.emit("event2")
            assert.strictEqual(events.handler1, undefined)
            assert.strictEqual(events.handler2, true)
            broker.emit("event1")
            assert.strictEqual(events.handler1, true)

            delete events.handler1
            delete events.handler2
            broker.unsubscribe("event1", handler2)
            broker.emit("event1")
            assert.strictEqual(events.handler1, true)
            assert.strictEqual(events.handler2, undefined)

            delete events.handler1
            broker.unsubscribe("event1", events.handlerGenerator(1))
            broker.emit("event1")
            assert.strictEqual(events.handler1, true)
            assert.strictEqual(events.handler2, undefined)

            delete events.handler1
            broker.unsubscribe("event1", handler1)
            broker.emit("event1")
            assert.strictEqual(events.handler1, undefined)
            assert.strictEqual(events.handler2, undefined)
        })
    })
})

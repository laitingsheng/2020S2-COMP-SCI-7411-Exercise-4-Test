const assert = require("assert")

class EventsRecord {
    generateHandler(number) {
        return () => {
            this[`handler${number}`] = true
        }
    }
}

describe("test broker.js", function() {
    let failed = true

    it("preliminary test on module exports", function() {
        const broker = require("../broker.js")

        // test function signature
        assert.ok(broker.emit instanceof Function)
        assert.strictEqual(broker.emit.length, 1)
        assert.ok(broker.subscribe instanceof Function)
        assert.strictEqual(broker.subscribe.length, 2)
        assert.ok(broker.unsubscribe instanceof Function)
        assert.strictEqual(broker.unsubscribe.length, 2)

        failed = false
    })

    describe("test correctness", function() {
        before("skip test if the module test failed", function() {
            if (failed)
                this.skip()
        })

        beforeEach(function() {
            // remove module cache
            delete require.cache["../broker.js"]
        })

        it("simple test", function() {
            const broker = require("../broker.js")

            const events = new EventsRecord()
            const handler1 = events.generateHandler(1)
            const handler2 = events.generateHandler(2)

            // initialisation
            broker.subscribe("event1", handler1)
            broker.subscribe("event2", handler2)

            // test #subscribe + #emit
            broker.emit("event2")
            assert.strictEqual(events.handler1, undefined)
            assert.strictEqual(events.handler2, true)
            broker.emit("event1")
            assert.strictEqual(events.handler1, true)
            assert.strictEqual(events.handler2, true)

            delete events.handler1
            delete events.handler2

            // removing a handler not registered for a specific event
            broker.unsubscribe("event1", handler2)
            broker.emit("event1")
            assert.strictEqual(events.handler1, true)

            delete events.handler1

            // a new function object is different from the original one though they have the same behaviour
            broker.unsubscribe("event1", events.generateHandler(1))
            broker.emit("event1")
            assert.strictEqual(events.handler1, true)

            delete events.handler1

            // test #unsubscribe
            broker.unsubscribe("event1", handler1)
            broker.emit("event1")
            assert.strictEqual(events.handler1, undefined)
        })

        it("test event not exists", function () {
            const broker = require("../broker.js")

            const events = new EventsRecord()

            broker.emit("event")
            assert.strictEqual(Object.keys(events).length, 0)
        })

        it("1 handler | 5 events", function () {
            const broker = require("../broker.js")

            const events = new EventsRecord()
            const handler1 = events.generateHandler(1)

            for (i = 0; i < 5; ++i)
                broker.subscribe(`event${i}`, handler1)

            // basic test
            for (i = 0; i < 5; ++i) {
                broker.emit(`event${i}`)
                assert.strictEqual(events.handler1, true)
                delete events.handler1
            }

            // test if #unsubscribe from a event will not affect others
            for (i = 0; i < 5; ++i) {
                const event = `event${i}`
                broker.unsubscribe(event, handler1)

                let j = 0

                // ensure unsubscribed handlers no longer work
                for (; j <= i; ++j) {
                    broker.emit(event)
                    assert.strictEqual(events.handler1, undefined)
                }

                // extra check to ensure other subscriptions were not affected
                for (; j < 5; ++j) {
                    broker.emit(`event${j}`)
                    assert.strictEqual(events.handler1, true)
                    delete events.handler1
                }
            }
        })

        it("1 event | 5 handlers", function () {
            const broker = require("../broker.js")

            const events = new EventsRecord()
            const rm = [0, 1, 2, 3, 4].map(i => [events.generateHandler(i), i])

            rm.forEach(([handler, _]) => broker.subscribe("event", handler))
            broker.emit("event")

            // check all subscribed handlers work
            rm.forEach(([_, i]) => {
                const handlerLabel = `handler${i}`
                assert.strictEqual(events[handlerLabel], true)
                delete events[handlerLabel]
            })

            rm.forEach(([handler, i]) => {
                broker.unsubscribe("event", handler)
                broker.emit("event")

                let j = 0

                // ensure unsubscribed handlers no longer work
                for (; j <= i; ++j)
                    assert.strictEqual(events[`handler${j}`], undefined)

                // extra check to ensure other subscriptions were not affected
                for (; j < 5; ++j) {
                    handlerLabel = `handler${j}`
                    assert.strictEqual(events[handlerLabel], true)
                    delete events[handlerLabel]
                }
            })
        })
    })
})

'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { connect, isConnected, applySchemaDefaults, Repository } = require('../index');

describe('db-kit contract tests', () => {
    const validId = new mongoose.Types.ObjectId().toString();

    // --- SUCCESS CASES ---

    it('applies timestamps and clean toJSON defaults to a schema', () => {
        const schema = new mongoose.Schema({ name: String });
        applySchemaDefaults(schema);

        assert.equal(schema.get('timestamps'), true);

        const Sample = mongoose.model('DbKitTestModel', schema);
        const doc = new Sample({ name: 'Item 1' });
        const json = doc.toJSON();

        assert.equal(json.id, doc._id.toString());
        assert.equal(json._id, undefined);
        assert.equal(json.__v, undefined);
    });

    it('creates, finds, updates, and deletes using Repository with a mock model', async () => {
        const store = new Map();

        function MockModel(data) {
            Object.assign(this, { _id: validId, ...data });
            this.save = async () => {
                store.set(this._id, this);
                return this;
            };
        }
        MockModel.findById = async (id) => store.get(id) || null;
        MockModel.find = async () => Array.from(store.values());
        MockModel.findByIdAndUpdate = async (id, data) => {
            const item = store.get(id);
            if (!item) return null;
            Object.assign(item, data);
            return item;
        };
        MockModel.findByIdAndDelete = async (id) => {
            const item = store.get(id) || null;
            store.delete(id);
            return item;
        };

        const repo = new Repository(MockModel);
        const created = await repo.create({ name: 'Widget' });
        assert.equal(created.name, 'Widget');

        const found = await repo.findById(validId);
        assert.equal(found.name, 'Widget');

        const updated = await repo.update(validId, { name: 'Updated Widget' });
        assert.equal(updated.name, 'Updated Widget');

        await repo.delete(validId);
        assert.equal(await repo.findById(validId), null);
    });

    it('reports false for isConnected when disconnected', () => {
        assert.equal(isConnected(), false);
    });

    // --- FAILURE CASES ---

    it('rejects connect() when no URI is passed', async () => {
        await assert.rejects(() => connect(), /URI string must be provided/);
    });

    it('throws when Repository is constructed without a model or given an invalid ID', async () => {
        assert.throws(() => new Repository(), /Mongoose model is required/);

        const repo = new Repository({});
        await assert.rejects(() => repo.findById('bad-id'), /Invalid ID/);
    });
});

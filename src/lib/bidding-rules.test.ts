import { test } from "node:test";
import assert from "node:assert/strict";
import {
  bidRejectionMessage,
  isStrictlyHigherThanCurrent,
  minimumValidBidCents,
  takesFirstPlace,
} from "./bidding-rules";

test("list placement accepts a custom price of $1 or more", () => {
  const snapshot = {
    currentBidCents: 3700,
    hasWinner: true,
    startingBidCents: 100,
    minIncrementCents: 100,
  };
  assert.equal(minimumValidBidCents(snapshot, "list"), 100);
  assert.equal(bidRejectionMessage(100, snapshot, "list"), null);
  assert.equal(takesFirstPlace(100, snapshot), false);
});

test("first placement must beat the current #1", () => {
  const snapshot = {
    currentBidCents: 3700,
    hasWinner: true,
    startingBidCents: 100,
    minIncrementCents: 100,
  };
  assert.equal(minimumValidBidCents(snapshot, "first"), 3701);
  assert.equal(isStrictlyHigherThanCurrent(3701, snapshot), true);
  assert.match(bidRejectionMessage(3700, snapshot, "first") ?? "", /#1/);
  assert.equal(bidRejectionMessage(3701, snapshot, "first"), null);
});

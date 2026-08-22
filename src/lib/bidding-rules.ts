export type AuctionSnapshot = {
  currentBidCents: number;
  hasWinner: boolean;
  startingBidCents: number;
  minIncrementCents: number;
};

export type Placement = "first" | "list";

export function minimumValidBidCents(
  snapshot: AuctionSnapshot,
  placement: Placement = "list",
): number {
  if (placement === "first") {
    if (snapshot.currentBidCents > 0) {
      return snapshot.currentBidCents + 1;
    }
    return snapshot.startingBidCents;
  }
  return 100;
}

export function takesFirstPlace(bidCents: number, snapshot: AuctionSnapshot): boolean {
  return bidCents > snapshot.currentBidCents;
}

export function isStrictlyHigherThanCurrent(
  bidCents: number,
  snapshot: AuctionSnapshot,
): boolean {
  return takesFirstPlace(bidCents, snapshot);
}

export function bidRejectionMessage(
  bidCents: number,
  snapshot: AuctionSnapshot,
  placement: Placement = "list",
): string | null {
  const min = minimumValidBidCents(snapshot, placement);
  if (bidCents < min) {
    if (placement === "first") {
      return `To take the #1 spot, pay at least $${min / 100}.`;
    }
    return `Enter a custom price of at least $1.`;
  }
  return null;
}

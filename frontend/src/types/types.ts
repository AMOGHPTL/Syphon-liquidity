export interface MarketParams {
    collateralToken:string
    loanToken:string
    oracle:string
    irm:string
     lltv:string
}

export interface Position {
     supplyShares:string
     borrowShares:string
     collateral:string
}

export interface Market {
     totalSupplyAssets:string
     totalSupplyShares:string
     totalBorrowAssets:string
     totalBorrowShares:string
     lastUpdate:string
     fee:string
}
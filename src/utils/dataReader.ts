import productFees from '../data/productFees.json';
import productMaxWeight from '../data/productMaxWeight.json';
import productThreshold from '../data/productThreshold.json';

export const getProductFees = () => productFees.productFees;
export const getProductMaxWeight = () => productMaxWeight.productMaxWeight;
export const getProductThreshold = () => productThreshold.productThreshold;

export type ProductFee = {
    plcName: string;
    plcCode: string;
    weightLimit: string;
    weight: string;
    girth: number;
    localOrderFee: number;
    localReturnFee: number;
    crossBorderOrderFee: number;
    crossBorderReturnFee: number;
    removalFee: number;
    disposalFee: number;
};

export type ProductMaxWeight = {
    plcName: string;
    minWeight: number;
    maxWeight: number;
    localOrderFee: number;
    localReturnFee: number;
    removalFee: number;
    disposalFee: number;
};

export type ProductThreshold = {
    code: string;
    period: string;
    threshold: string;
    thresholdRandom: number;
    feePerCubicMeterPerDay: number;
}; 
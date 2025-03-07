// app/services/fulfillment.ts
import { getProductFees, getProductMaxWeight, getProductThreshold, ProductFee, ProductMaxWeight, ProductThreshold } from '@/utils/dataReader';

export class Fulfillment {
    private height: number;
    private width: number;
    private length: number;
    private weight: number;
    private days: number;

    constructor({ height, width, length, weight, days }: { 
        height: number; 
        width: number; 
        length: number; 
        weight: number; 
        days: number 
    }) {
        this.height = height;
        this.width = width;
        this.length = length;
        this.weight = weight;
        this.days = days;
    }

    private throwError(msg: string) {
        throw new Error(msg);
    }

    async fulFillmentWeightList() {
        const obj = [this.length, this.height, this.width];
        const sortedValues = obj.sort((a, b) => a - b);
        
        let GirthValue = (sortedValues[0] + sortedValues[1]) * 2 + sortedValues[2];
        GirthValue = GirthValue * 10;

        let plcName = '';
        const ranges = [
            { min: 0, max: 520, plc: 'PLC-1' },
            { min: 520, max: 840, plc: 'PLC-2' },
            { min: 840, max: 890, plc: 'PLC-3' },
            { min: 890, max: 920, plc: 'PLC-4' },
            { min: 920, max: 1650, plc: 'PLC-5' },
            { min: 1650, max: 2450, plc: 'PLC-6' },
            { min: 2450, max: 3600, plc: 'PLC-7' },
            { min: 3600, max: 4400, plc: 'PLC-8' },
            { min: 4400, max: 4620, plc: 'PLC-9' }
        ];

        for (let range of ranges) {
            if (GirthValue > range.min && GirthValue <= range.max) {
                plcName = range.plc;
                break;
            }
        }

        if (!plcName) {
            this.throwError("Product with these dimensions does not exist.");
        }

        // Get data from local JSON instead of MongoDB
        const allProductFees = getProductFees();
        const data = allProductFees
            .filter(fee => fee.girth >= GirthValue && fee.plcName === plcName)
            .sort((a, b) => a.girth - b.girth);

        console.log("Weight calculation logic here");
        return { data, GirthValue, plcName };
    }

    partitionDays() {
        let totalDays = this.days;
        const dayRange = [];
        let start = 1;

        while (totalDays > 0) {
            const intervalDays = Math.min(30, totalDays);
            const end = start + intervalDays - 1;
            dayRange.push({
                start: start === 1 ? 0 : start,
                end,
                days: intervalDays
            });
            totalDays -= intervalDays;
            start = end + 1;
        }
        return { dayRange };
    }

    async PriceCalculation(dayRange: { start: number; end: number; days: number }[]) {
        let length = this.length / 100;
        let height = this.height / 100;
        let width = this.width / 100;
        let volume = length * height * width;
        let thresholdPrice = 0;

        // Get data from local JSON instead of MongoDB
        const allThresholds = getProductThreshold();

        for (let item of dayRange) {
            try {
                // Find matching threshold from local data
                const result = allThresholds.find(threshold => 
                    ((threshold.thresholdRandom >= item.end && threshold.period === "January - September") ||
                    (threshold.threshold === "> 365" && threshold.period === "January - September"))
                );

                if (result) {
                    const sum = volume * item.days * result.feePerCubicMeterPerDay;
                    thresholdPrice += sum;
                }
            } catch (error) {
                console.error("Error processing data:", error);
            }
        }

        console.log("Final Threshold Price:", thresholdPrice);
        return { thresholdPrice };
    }

    async fulFillmentWeightCheck(result: any, GirthValue: number, plcName: string) {
        // Get data from local JSON instead of MongoDB
        const allProductFees = getProductFees();
        const allMaxWeights = getProductMaxWeight();

        // Filter product fees based on criteria
        const results = allProductFees.filter(fee => 
            fee.plcName === plcName && 
            ((fee.weight.startsWith("≤") && parseFloat(fee.weightLimit) >= this.weight) ||
             (fee.weight.startsWith(">") && parseFloat(fee.weightLimit) < this.weight))
        );

        console.log("ProductFees results:", results);
        let weightCheck: any[] = [];

        if (this.weight <= 2 && results.length > 0) {
            console.log("Weight exists in the valid range: within 2 kg");
            const record = results.find((entry) => this.weight <= parseFloat(entry.weightLimit));

            if (record) {
                weightCheck.push(record);
            } else {
                console.error("No matching record found for the given weight.");
                this.throwError("No matching record found for the given weight.");
            }
        } else {
            // Get the base fee from ProductFees
            const baseFeeRecord = allProductFees.find(fee =>
                fee.plcName === plcName && fee.weight === "> 2 kg"
            );

            console.log("Base fee record:", baseFeeRecord);
            
            let baseLocalOrderFee = baseFeeRecord ? baseFeeRecord.localOrderFee : 0;
            let weightLimit = baseFeeRecord ? parseFloat(baseFeeRecord.weightLimit) : 0;

            // Get the weight multiplier from productMaxWeight
            weightCheck = allMaxWeights.filter(weight =>
                weight.minWeight <= this.weight &&
                weight.maxWeight >= this.weight &&
                weight.plcName === plcName
            );

            if (weightCheck && weightCheck.length > 0) {
                let extraWeight = this.weight - weightLimit;
                // Calculate total fee using base fee plus extra weight * multiplier
                weightCheck[0].localOrderFee = baseLocalOrderFee + (extraWeight * weightCheck[0].localOrderFee);
                console.log("Weight calculation:", {
                    baseLocalOrderFee,
                    extraWeight,
                    multiplier: weightCheck[0].localOrderFee,
                    finalFee: weightCheck[0].localOrderFee
                });
            } else {
                weightCheck = allMaxWeights.filter(weight =>
                    weight.plcName === plcName
                );
                let weightKg = '';
                if (weightCheck && weightCheck.length > 0) {
                    weightKg = weightCheck.length === 1 
                        ? weightCheck[0].maxWeight.toString()
                        : weightCheck.length === 2 
                            ? weightCheck[1].maxWeight.toString()
                            : '';
                }
                console.error("Weight does not exist in the valid range.");
                this.throwError(`Product with these dimensions can not have weight more than ${weightKg}KG.`);
            }
        }
        return { weightCheck, results };
    }
}

export default Fulfillment;
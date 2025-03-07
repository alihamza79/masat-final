// app/api/client/withFBE/weightCalculation/route.ts
import { NextResponse } from 'next/server';
import { Fulfillment } from '@/app/services/fulfillment';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { length, height, width, weight, days } = body;

        const fullfillmentInstance = new Fulfillment({
            height: parseInt(height),
            width: parseInt(width),
            length: parseInt(length),
            weight: parseInt(weight),
            days: parseInt(days)
        });

        const { data, GirthValue, plcName } = await fullfillmentInstance.fulFillmentWeightList();
        const { weightCheck, results } = await fullfillmentInstance.fulFillmentWeightCheck(data, GirthValue, plcName);
        const { dayRange } = fullfillmentInstance.partitionDays();
        const { thresholdPrice } = await fullfillmentInstance.PriceCalculation(dayRange);

        let fulfillmentCost = weightCheck.length > 0 ? weightCheck[0].localOrderFee : 0;

        return NextResponse.json({
            status: true,
            message: 'Weight calculation successful',
            fulfillmentCost: fulfillmentCost,
            thresholdPrice: (thresholdPrice).toFixed(4),
            totalFulFilmentPrice: (thresholdPrice + fulfillmentCost).toFixed(4),
            data: { weightCheck, results }
        });

    } catch (error: any) {
        return NextResponse.json({
            status: false,
            message: error.message
        }, { status: 400 });
    }
}
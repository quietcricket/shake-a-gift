
let { config, DynamoDB } = require('aws-sdk');
config.update({ region: 'ap-northeast-1' });
const ddb = new DynamoDB({ apiVersion: '2012-08-10' });
const TABLE_NAME = 'CouponDB';

exports.handler = async (event) => {
	// Default coupon. In the event all coupons are released, use this one
	let coupon = 'nAASbE54TfYD'
	let index;
	try {
		index = await ddb.updateItem({
			TableName: TABLE_NAME,
			Key: { id: { N: '1' } },
			UpdateExpression: "set next_id= next_id + :i",
			ExpressionAttributeValues: { ":i": { N: '1' } },
			ReturnValues: 'UPDATED_NEW'
		}).promise()
	} catch (err) { console.log(err); }


	let origin = event.headers.Origin || event.headers.origin;
	// I don't think this is useful
	if (origin != 'https://pcexp.app' && false) {
		return {
			statusCode: 200,
			body: JSON.stringify({ c: 'invalid' })
		}
	}
	try {
		let data = await ddb.updateItem({
			TableName: TABLE_NAME,
			Key: { id: { N: index.Attributes.next_id.N + '' } },
			UpdateExpression: "set issued_at= :t",
			ExpressionAttributeValues: { ":t": { S: new Date().toISOString() } },
			ReturnValues: 'ALL_NEW'
		}).promise();
		coupon = data.Attributes.coupon.S;
	} catch (err) { console.log(err); }

	const response = {
		statusCode: 200,
		headers: {
			"Access-Control-Allow-Headers": "Content-Type",
			"Access-Control-Allow-Origin": origin,
			"Access-Control-Allow-Methods": "OPTIONS,GET"
		},
		body: JSON.stringify({ c: coupon }),
	};
	return response;
};

async function populate() {
	let path = process.env.HOME + '/Downloads/CDKEYS.csv';
	let reader = require('readline').createInterface(require('fs').createReadStream(path));
	var params = { RequestItems: {} };
	params.RequestItems[TABLE_NAME] = []
	let counter = 2;
	for await (let line of reader) {
		params.RequestItems[TABLE_NAME].push(
			{ PutRequest: { Item: { id: { N: counter + '' }, coupon: { S: line.split(',')[0] } } } }
		);
		counter++;
		if (counter % 25 == 0) {
			ddb.batchWriteItem(params, (err, data) => console.log(err, data));
			console.log(counter);
			params.RequestItems[TABLE_NAME] = []
			await new Promise(resolve => setTimeout(resolve, 200));
		}
	}
}
populate();
// getCoupon(3);
// exports.handler();
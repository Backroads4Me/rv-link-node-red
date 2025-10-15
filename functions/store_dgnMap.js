// Convert the data to a Map when initially storing it
const dgnMap = new Map(
    msg.payload.map(entry => [
        entry.Hex.toString().toUpperCase(),
        entry.DGN
    ])
);

// Add the special case for FECA
//if (dgnMap.has('FECA')) {
//    dgnMap.set('1FECA', dgnMap.get('FECA'));
//}

// Store the Map in global context
global.set('dgnMap', dgnMap);

// Count the number of records
const decoderCount = dgnMap.size;

// Update the node status to indicate success
node.status({ fill: 'green', shape: 'dot', text: `Config loaded, ${decoderCount} records` });
return null;
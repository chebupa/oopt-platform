const fs = require('fs');
const content = fs.readFileSync('frontend/src/store/index.ts', 'utf8');

let newContent = content.replace(
  /coordinates: \[number, number\]; \/\/ \[longitude, latitude\]/,
  "polygon: [number, number][];\n  color?: string;"
);

// Update initialTasks
newContent = newContent.replace(
  /coordinates: \[37\.712, 55\.832\],/g,
  "polygon: [[37.712, 55.832], [37.715, 55.832], [37.715, 55.835], [37.712, 55.835], [37.712, 55.832]],\n    color: '#ff4d4f',"
);
newContent = newContent.replace(
  /coordinates: \[37\.730, 55\.825\],/g,
  "polygon: [[37.730, 55.825], [37.733, 55.823], [37.735, 55.826], [37.730, 55.825]],\n    color: '#faad14',"
);
newContent = newContent.replace(
  /coordinates: \[37\.750, 55\.840\],/g,
  "polygon: [[37.750, 55.840], [37.752, 55.839], [37.753, 55.842], [37.750, 55.842], [37.750, 55.840]],\n    color: '#52c41a',"
);

// Update convertAlertToTask
newContent = newContent.replace(
  /coordinates: alert\.coordinates,/,
  `polygon: [
        [alert.coordinates[0] - 0.002, alert.coordinates[1] - 0.002],
        [alert.coordinates[0] + 0.002, alert.coordinates[1] - 0.002],
        [alert.coordinates[0] + 0.002, alert.coordinates[1] + 0.002],
        [alert.coordinates[0] - 0.002, alert.coordinates[1] + 0.002],
        [alert.coordinates[0] - 0.002, alert.coordinates[1] - 0.002]
      ],
      color: '#1890ff',`
);

fs.writeFileSync('frontend/src/store/index.ts', newContent);
console.log("Updated store/index.ts");

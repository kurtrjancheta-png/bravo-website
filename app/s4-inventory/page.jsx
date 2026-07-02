import { getSheetData } from '../../lib/googleSheets';
import S4InventoryClient from './S4InventoryClient';

export const revalidate = 60; // Cache for 60 seconds

export default async function S4InventoryPage() {
  const sheetId = '1UGGxJCoQpetYtqGOCxI-PSMPY1at5O9b3ayFd1pzqRs';
  const rawData = await getSheetData(sheetId, 'INVENTORY');

  const electronics = [];
  const furniture = [];
  const miscellaneous = [];

  let lastElecType = 'ELECTRONICS';
  let lastMiscType = 'MISCELLANEOUS';

  rawData.forEach(row => {
    // 1. Parse Electronics & Appliances
    const elecType = String(row['ELECTRONICS/APPLIANCES TYPE'] || '').trim();
    if (elecType) {
      lastElecType = elecType;
    }
    const elecItem = row['ITEM'];
    if (elecItem && String(elecItem).trim() !== '') {
      electronics.push({
        type: lastElecType,
        name: String(elecItem).trim(),
        quantity: Number(row['QUANTITY']) || 0,
        condition: String(row['CONDITION'] || 'UNKNOWN').trim().toUpperCase(),
        remarks: String(row['REMARKS'] || '').trim()
      });
    }

    // 2. Parse Furniture
    const furnItem = row['FURNITURE ITEM'];
    if (furnItem && String(furnItem).trim() !== '') {
      furniture.push({
        name: String(furnItem).trim(),
        quantity: Number(row['QUANTITY (2)']) || 0,
        condition: String(row['CONDITION (2)'] || 'UNKNOWN').trim().toUpperCase(),
        remarks: String(row['REMARKS (2)'] || '').trim()
      });
    }

    // 3. Parse Miscellaneous
    const miscType = String(row['MISCELLANEOUS TYPE'] || '').trim();
    if (miscType) {
      lastMiscType = miscType;
    }
    const miscItem = row['ITEM (2)'];
    if (miscItem && String(miscItem).trim() !== '') {
      miscellaneous.push({
        type: lastMiscType,
        name: String(miscItem).trim(),
        quantity: Number(row['QUANTITY (3)']) || 0,
        condition: String(row['CONDITION (3)'] || 'UNKNOWN').trim().toUpperCase(),
        remarks: String(row['REMARKS (3)'] || '').trim()
      });
    }
  });

  return (
    <S4InventoryClient 
      electronics={electronics}
      furniture={furniture}
      miscellaneous={miscellaneous}
    />
  );
}

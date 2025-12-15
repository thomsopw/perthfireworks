/**
 * Clean and format malformed addresses by adding proper spacing
 */
export function cleanAddress(address: string): string {
  if (!address) return address;

  let cleaned = address
    // Fix common patterns - add spaces before common words
    .replace(/([A-Z])(BEACH|RIVER|PARK|OVAL|GROUND|QUAY|STAGE|INLET|ESPLANADE|DRIVE|DR|STREET|ST|ROAD|RD|CREST|PD|TCE|MOTORPLEX)/g, '$1 $2')
    // Fix specific known issues
    .replace(/BARGERIVERSIDE/g, 'BARGE RIVERSIDE')
    .replace(/RIVERSIDE DRPERTH/g, 'RIVERSIDE DRIVE PERTH')
    .replace(/RIVERSIDE DRIVEPERTH/g, 'RIVERSIDE DRIVE PERTH')
    .replace(/DRIVEPERTH/g, 'DRIVE PERTH')
    .replace(/NELSON CREAST/g, 'NELSON CRESCENT')
    .replace(/PDEELLENBROOK/g, 'PD ELLENBROOK')
    .replace(/BELGRAVIA STCLOVERDALE/g, 'BELGRAVIA ST CLOVERDALE')
    .replace(/FORESHORETHE/g, 'FORESHORE THE')
    .replace(/PARKSAIL/g, 'PARK SAIL')
    .replace(/TOWN OVAL SOMERSET STPINGELLY/g, 'TOWN OVAL SOMERSET ST PINGELLY')
    .replace(/MOTORPLEX ANKETELL RDKWINANA/g, 'MOTORPLEX ANKETELL RD KWINANA')
    .replace(/SERPENTINE RDKAMBALDA/g, 'SERPENTINE RD KAMBALDA')
    .replace(/ANKETELL RDKWINANA/g, 'ANKETELL RD KWINANA')
    .replace(/INLETTHE/g, 'INLET THE')
    .replace(/ESPLANADEPERTH/g, 'ESPLANADE PERTH')
    .replace(/BEACHRIVERSIDE/g, 'BEACH RIVERSIDE')
    .replace(/GROUNDNELSON/g, 'GROUND NELSON')
    .replace(/CAPRICORN BEACHRIVERSIDE/g, 'CAPRICORN BEACH RIVERSIDE')
    // Add space before WA (state)
    .replace(/(\d)(WA)/g, '$1 $2')
    // Add space before postcodes (4 digits)
    .replace(/([A-Z])(\d{4})/g, '$1 $2')
    // Clean up multiple spaces
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned;
}


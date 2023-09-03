/*export interface PublicSchool {
  School_Name: string;
  State_Name: string;
  State_Abbr: string;
  School_ID: string;
  Agency_Name: string;
  School_Type: string;
  Charter_School: string;
  Magnet_School: string;
  Shared_Time_School: string;
  Locale: string;
  Total_Students: number;
  Lowest_Grade: string;
  Highest_Grade: string;
  School_Level: string;
  FIPS_State_Code: number;
  Phone_Number: number;
  Website: string;
  FT_Teachers: number;
  Student_Teacher_Ratio: number;
  Full_Address: string;
  Latitude: number;
  Longitude: number;
  City: string;
  County: String;
  ZIP: number;
  Country: string;
  Private_Or_Public: string;
}*/
export interface PublicSchool {
  School_Name: string;
  State_Name: string;
  Full_Address: string;
  Latitude: number;
  Longitude: number;
  City: string;
  ZIP: number;
  Country: string;
  Private_Or_Public: string;
}
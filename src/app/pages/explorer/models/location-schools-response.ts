import { PublicExplorerSchool } from './public-explorer-school';
import { PrivateExplorerSchool } from './private-explorer-school';

export interface LocationSchoolsResponse {
  publicResults: PublicExplorerSchool[];
  privateResults: PrivateExplorerSchool[];
}
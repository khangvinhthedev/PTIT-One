import { pickApi } from '@/shared/api'

import * as httpCrossCampusApi from './httpCrossCampusApi'
import * as mockCrossCampusApi from './mockCrossCampusApi'

/** Điểm vào duy nhất — component import từ đây, không import thẳng bản giả. */
export const { cancelRequest, listCampuses, listHostClasses, myRequests, requestClass, retryRequest } =
  pickApi<typeof httpCrossCampusApi>(httpCrossCampusApi, mockCrossCampusApi)

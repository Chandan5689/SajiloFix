import api from '../api/axios';

const specialitiesService = {
  getSpecialities: async () => {
    const res = await api.get('/auth/specialities/');
    return res.data;
  },
  getSpecializations: async (specialityId) => {
    const res = await api.get(`/auth/specializations/${specialityId ? `?speciality_id=${specialityId}` : ''}`);
    return res.data;
  }
};

export default specialitiesService;

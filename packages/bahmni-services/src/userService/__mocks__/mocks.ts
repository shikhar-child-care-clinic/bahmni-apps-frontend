export const mockUsername = 'superman';
export const mockEncodedUsername = '%22superman%22';
export const mockQuotedUsername = '"superman"';
export const mockSpecialUsername = '@super.man%20';
export const mockEncodedSpecialUsername =
  encodeURIComponent(mockSpecialUsername);

export const mockUserResponse = {
  results: [
    {
      uuid: 'user-uuid-123',
      username: mockUsername,
      display: 'Superman User',
      person: {
        uuid: 'person-uuid-456',
        display: 'Superman',
      },
      privileges: [],
      roles: [
        {
          uuid: 'role-uuid-789',
          display: 'Clinician',
        },
      ],
    },
  ],
};

export const mockEncodedUserLocationCookie =
  '%7B%22name%22%3A%22Emergency%22%2C%22uuid%22%3A%22b5da9afd-b29a-4cbf-91c9-ccf2aa5f799e%22%7D';

export const mockUserLocation = {
  name: 'Emergency',
  uuid: 'b5da9afd-b29a-4cbf-91c9-ccf2aa5f799e',
};

export const mockAvailableLocations = [
  { name: 'Ward 1', uuid: 'loc-1' },
  { name: 'Ward 2', uuid: 'loc-2' },
];

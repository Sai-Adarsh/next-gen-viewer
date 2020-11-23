import { TestBed } from '@angular/core/testing';

import { ReplserviceService } from './replservice.service';

describe('ReplserviceService', () => {
  let service: ReplserviceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReplserviceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

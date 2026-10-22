import { describe, expect, it } from 'vitest';
import { flavorToPlan, groupImages, regionToSpec } from './vpsApi';

describe('vpsApi mapping', () => {
  it('maps a flavor to a PlanSpec card', () => {
    const plan = flavorToPlan({ id: 'f1', name: 'hf-2-4', vcpus: 2, ramMb: 4096, diskGb: 80, monthly: 6.99, priceSource: 'flavor' });
    expect(plan).toMatchObject({ id: 'f1', flavorId: 'f1', family: 'High Frequency', cpu: '2 CPU', ram: '4 GiB RAM', storage: '80 GiB Disk', monthly: 6.99 });
    expect(flavorToPlan({ id: 'f2', name: 'vds-1', vcpus: 1, ramMb: 1536, diskGb: 10, monthly: 2, priceSource: 'formula' })).toMatchObject({ family: 'Burstable', ram: '1.5 GiB RAM' });
  });

  it('groups Glance images per distro, newest version first, keeps image ids', () => {
    const groups = groupImages([
      { id: 'a', name: 'Ubuntu 22.04', distro: 'ubuntu', version: '22.04', kind: 'os', minDiskGb: 0, sizeBytes: null },
      { id: 'b', name: 'Ubuntu 24.04', distro: 'ubuntu', version: '24.04', kind: 'os', minDiskGb: 0, sizeBytes: null },
      { id: 'c', name: 'Ubuntu 24.04', distro: 'ubuntu', version: '24.04', kind: 'os', minDiskGb: 0, sizeBytes: null },
      { id: 'd', name: 'Docker CE', distro: 'docker', version: 'CE', kind: 'app', minDiskGb: 0, sizeBytes: null },
    ]);
    const ubuntu = groups.find((g) => g.id === 'ubuntu')!;
    expect(ubuntu).toMatchObject({ name: 'Ubuntu', icon: 'ubuntu', color: '#E95420', kind: 'os' });
    expect(ubuntu.versions).toEqual(['24.04 (2)', '24.04', '22.04']);
    expect(ubuntu.imageIds).toEqual({ '22.04': 'a', '24.04': 'b', '24.04 (2)': 'c' });
    expect(groups.find((g) => g.id === 'docker')!.kind).toBe('app');
  });

  it('unknown region falls back to its id with no ping', () => {
    expect(regionToSpec('eu-west2')).toEqual({ id: 'eu-west2', country: 'HostVDS', flag: 'eu', city: 'eu-west2', code: 'EU-WEST2' });
  });
});

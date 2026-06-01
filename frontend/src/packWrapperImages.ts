import type { BoosterType } from './packLabels';

import blbCollector from './assets/pack-wrappers/optimized/MTGBLB_EN_Bstr_Clctr_01_01.webp';
import blbPlay from './assets/pack-wrappers/optimized/MTGBLB_EN_Bstr_Play_01_01.webp';
import dskCollector from './assets/pack-wrappers/optimized/MTGDSK_EN_Bstr_Clctr_01_02.webp';
import dskPlay from './assets/pack-wrappers/optimized/MTGDSK_EN_Bstr_Play_01_02.webp';
import fdnCollector from './assets/pack-wrappers/optimized/MTGFND_EN_Bstr_Clctr_01_02.webp';
import fdnPlay from './assets/pack-wrappers/optimized/MTGFND_EN_Bstr_Play_01_02.webp';
import lciCollector from './assets/pack-wrappers/optimized/MTGLCI_EN_ClctrBstr_01_02.webp';
import lciPlay from './assets/pack-wrappers/optimized/MTGLCI_EN_Bstr_Set_01_02.webp';
import mkmCollector from './assets/pack-wrappers/optimized/MTGMKM_EN_ClctrBstr_01_02.webp';
import mkmPlay from './assets/pack-wrappers/optimized/MTGMKM_EN_Bstr_Play_01_02.webp';
import momCollector from './assets/pack-wrappers/optimized/MTG_MOM_EN_Bstr_Clctr_01_02.webp';
import momPlay from './assets/pack-wrappers/optimized/MTGMOM_EN_Bstr_Set_01_02.webp';
import oneCollector from './assets/pack-wrappers/optimized/MTGONE_EN_ClctrBstr_01_02.webp';
import onePlay from './assets/pack-wrappers/optimized/MTGONE_EN_Bstr_Set_01_02.webp';
import otjCollector from './assets/pack-wrappers/optimized/MTGOTJ_EN_ClctrBstr_1_2.webp';
import otjPlay from './assets/pack-wrappers/optimized/MTGOTJ_EN_Bstr_Play_1_2.webp';
import woeCollector from './assets/pack-wrappers/optimized/MTGWOE_EN_ClctrBstr_01_02.webp';
import woePlay from './assets/pack-wrappers/optimized/MTGWOE_EN_Bstr_Set_01_02.webp';

type PackWrapperImage = {
  cropScale?: number;
  fit?: 'contain' | 'cover';
  src: string;
};

const packWrapperImages: Record<string, Partial<Record<BoosterType, PackWrapperImage>>> = {
  blb: {
    collector: { src: blbCollector },
    play: { src: blbPlay },
  },
  dsk: {
    collector: { src: dskCollector },
    play: { src: dskPlay },
  },
  fdn: {
    collector: { src: fdnCollector },
    play: { src: fdnPlay },
  },
  lci: {
    collector: { src: lciCollector },
    play: { src: lciPlay },
  },
  mkm: {
    collector: { src: mkmCollector },
    play: { src: mkmPlay },
  },
  mom: {
    collector: { cropScale: 1.12, fit: 'cover', src: momCollector },
    play: { src: momPlay },
  },
  one: {
    collector: { src: oneCollector },
    play: { src: onePlay },
  },
  otj: {
    collector: { src: otjCollector },
    play: { src: otjPlay },
  },
  woe: {
    collector: { src: woeCollector },
    play: { src: woePlay },
  },
};

export function getPackWrapperImage(
  setCode: string | undefined,
  boosterType: BoosterType,
): PackWrapperImage | undefined {
  if (!setCode) {
    return undefined;
  }

  return packWrapperImages[setCode.toLowerCase()]?.[boosterType];
}

export function preloadPackWrapperImages() {
  Object.values(packWrapperImages).forEach((imagesByBoosterType) => {
    Object.values(imagesByBoosterType).forEach((image) => {
      if (!image) {
        return;
      }
      const preloadImage = new Image();
      preloadImage.src = image.src;
    });
  });
}

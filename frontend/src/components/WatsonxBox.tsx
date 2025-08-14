import React from 'react';
import styles from './WatsonxBox.module.css';
import WatsonxLogo from '../assets/watsonx_logo.png';

const WatsonxBox: React.FC = () => (
  <div className={styles.aiLayer}>
    <div className={styles.aiLayerGradient} />
    <img
      src={WatsonxLogo}
      alt="Watsonx Logo"
      className={styles.aiLayerLogo}
    />
  </div>
);

export default WatsonxBox;
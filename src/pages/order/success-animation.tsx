import { closeIcon } from '@/utils';
import { Input } from 'antd';
import { useEffect, useState } from 'react';
import './index.less';

const confetti = require('canvas-confetti');

const SuccessAnimation = ({ setVisible, spd }: any) => {
  const [countdown, setCountdown] = useState<number>(5);

  useEffect(() => {
    if (countdown === 0) {
      setVisible(false);
    }
    if (!countdown) return;
    const intervalId = setInterval(() => {
      setCountdown(countdown - 1);
    }, 1000);
    return () => clearInterval(intervalId);
  }, [countdown]);

  useEffect(() => {
    var canvas = document.getElementById('animation_confetti');
    if (canvas) {
      const canvasConfetti = confetti.create(canvas, { resize: true });
      canvasConfetti({
        particleCount: 100,
        spread: 70
      });
    }
  }, []);

  // console.log('SuccessAnimation', countdown);

  return (
    <div className="success_animation_wrapper">
      <div className="animation_content">
        <div
          className="close_btn"
          onClick={() => {
            setVisible(false);
          }}
        >
          <div className="close_sec">{countdown}</div>
          {closeIcon}
        </div>
        <Input type="checkbox" checked />
        <svg viewBox="0 0 400 400" width="400" height="400" className="success_svg">
          <circle
            fill="none"
            stroke="#68E534"
            strokeWidth="20"
            cx="200"
            cy="200"
            r="190"
            className="circle"
            strokeLinecap="round"
            transform="rotate(-90 200 200) "
          />
          <polyline
            fill="none"
            stroke="#68E534"
            strokeWidth="24"
            points="88,214 173,284 304,138"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="tick"
          />
        </svg>
        <div className="success_result">{spd ? 'Transfer request sent' : 'Transfer Completed'}</div>
      </div>
      <canvas id="animation_confetti"></canvas>
    </div>
  );
};

export default SuccessAnimation;

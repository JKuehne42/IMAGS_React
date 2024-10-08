import React, { useState, useEffect } from 'react';

const SerialDataComponent: React.FC = () => {
    const [gsrData, setGsrData] = useState<number | null>(null);
    const [pulseData, setPulseData] = useState<number | null>(null);
    const [bpmData, setBpmData] = useState<number | null>(null);
    const [heartbeatDetected, setHeartbeatDetected] = useState<boolean | null>(null);
    const [port, setPort] = useState<any | null>(null);
    const [reader, setReader] = useState<any | null>(null);

    // Function to connect to the Arduino's serial port
    const connectToSerial = async () => {
        try {
            const port = await navigator.serial.requestPort();
            await port.open({ baudRate: 9600 });
            const textDecoder = new TextDecoderStream();
            const readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
            const reader = textDecoder.readable.getReader();
            setPort(port);
            setReader(reader);
            console.log('Connected to serial port');
        } catch (error) {
            console.error('Failed to connect to serial port:', error);
        }
    };

    useEffect(() => {
        if (reader) {
            const intervalId = setInterval(() => {
                readSerialData();
            }, 1000);
            return () => clearInterval(intervalId);
        }
    }, [reader]);

    const readSerialData = async () => {
        try {
            const { value, done } = await reader.read();
            if (done) {
                reader.releaseLock();
                return;
            }
            const data = JSON.parse(value);
            setGsrData(data.GSR);
            setPulseData(data.Pulse);
            setBpmData(data.BPM);
            setHeartbeatDetected(data.Heartbeat);
        } catch (error) {
            console.error('Error reading from serial port:', error);
        }
    };

    return (
        <div style={{ position: 'relative', zIndex: 10, padding: '20px' }}>
            <button
                onClick={connectToSerial}
                style={{
                    padding: '10px',
                    margin: '20px',
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    zIndex: 10,  // Ensures it's above other elements
                    position: 'relative',
                }}
            >
                Connect to Arduino
            </button>
            <div>
                <p>GSR Data: {gsrData}</p>
                <p>Pulse Data: {pulseData}</p>
                <p>BPM: {bpmData}</p>
                <p>Heartbeat Detected: {heartbeatDetected ? 'Yes' : 'No'}</p>
            </div>
        </div>
    );
};

export default SerialDataComponent;

import React, { useState, useEffect } from 'react';

const SerialDataComponent: React.FC = () => {
    const [gsrData, setGsrData] = useState<number | null>(null);
    const [pulseData, setPulseData] = useState<number | null>(null);
    const [bpmData, setBpmData] = useState<number | null>(null);
    const [heartbeatDetected, setHeartbeatDetected] = useState<boolean | null>(null);
    const [port, setPort] = useState<any | null>(null);
    const [reader, setReader] = useState<any | null>(null);
    const [buffer, setBuffer] = useState<string>(''); // Buffer for accumulating chunks

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

    // Validate if a string is valid JSON
    const isValidJSON = (str: string) => {
        try {
            JSON.parse(str);
            return true;
        } catch (e) {
            return false;
        }
    };

    useEffect(() => {
        const readSerialData = async () => {
            while (reader) {
                try {
                    const { value, done } = await reader.read();
                    if (done) {
                        reader.releaseLock();
                        return;
                    }

                    if (value) {
                        // Accumulate incoming data in the buffer
                        let newBuffer = buffer + value;

                        // Split buffer into potential JSON objects using newline '\n'
                        const parts = newBuffer.split('\n');

                        parts.forEach((part, index) => {
                            if (part.trim() === '') return; // Skip empty parts

                            // Check for complete JSON and parse only valid JSON objects
                            if (isValidJSON(part.trim())) {
                                try {
                                    const jsonData = JSON.parse(part.trim());
                                    setGsrData(jsonData.GSR);
                                    setPulseData(jsonData.Pulse);
                                    setBpmData(jsonData.BPM);
                                    setHeartbeatDetected(jsonData.Heartbeat);
                                    console.log('Extracted JSON:', jsonData);
                                } catch (error) {
                                    console.error('Failed to parse JSON:', error, 'Line:', part.trim());
                                }
                            } else {
                                console.warn('Invalid JSON skipped:', part.trim());
                            }
                        });

                        // Keep the remaining unprocessed data in the buffer
                        newBuffer = parts[parts.length - 1].includes('{') ? parts[parts.length - 1] : '';
                        setBuffer(newBuffer);
                    }
                } catch (error) {
                    console.error('Error reading from serial port:', error);
                }
            }
        };

        if (reader) {
            readSerialData();
        }
    }, [reader, buffer]);

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
                    zIndex: 10,
                    position: 'relative',
                }}
            >
                Connect to Arduino
            </button>
            <div>
                <p>GSR Data: {gsrData !== null ? gsrData : 'No data'}</p>
                <p>Pulse Data: {pulseData !== null ? pulseData : 'No data'}</p>
                <p>BPM: {bpmData !== null ? bpmData : 'No data'}</p>
                <p>Heartbeat Detected: {heartbeatDetected !== null ? (heartbeatDetected ? 'Yes' : 'No') : 'No data'}</p>
            </div>
        </div>
    );
};

export default SerialDataComponent;

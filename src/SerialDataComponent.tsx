import React, { useState, useEffect } from 'react';

const SerialDataComponent: React.FC = () => {
    const [gsrData, setGsrData] = useState<number | null>(null);
    const [pulseData, setPulseData] = useState<number | null>(null);
    const [bpmData, setBpmData] = useState<number | null>(null);
    const [heartbeatDetected, setHeartbeatDetected] = useState<boolean | null>(null);
    const [port, setPort] = useState<any | null>(null);
    const [reader, setReader] = useState<any | null>(null);
    const [incomingData, setIncomingData] = useState<string>(''); // Buffer for accumulating chunks

    // Function to connect to the Arduino's serial port
    const connectToSerial = async () => {
        try {
            const port = await navigator.serial.requestPort();
            await port.open({ baudRate: 9600 }); // Consider increasing baudRate if needed
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
        const readSerialData = async () => {
            while (reader) {
                try {
                    const { value, done } = await reader.read();
                    if (done) {
                        reader.releaseLock();
                        return;
                    }

                    if (value) {
                        // Append incoming data chunk to the buffer
                        const newData = incomingData + value;
                        setIncomingData(newData);

                        // Check if we have a complete JSON object (e.g., ending with `}`)
                        const jsonObjects = newData.split('}'); // Split by closing brace to detect complete JSON objects

                        jsonObjects.forEach((jsonObject, index) => {
                            if (jsonObject.trim() === '') return; // Skip empty strings

                            if (jsonObject.includes('{') && index < jsonObjects.length - 1) {
                                // Add the closing brace back and try parsing
                                const completeJSON = jsonObject.trim() + '}';
                                try {
                                    const parsedData = JSON.parse(completeJSON);
                                    setGsrData(parsedData.GSR);
                                    setPulseData(parsedData.Pulse);
                                    setBpmData(parsedData.BPM);
                                    setHeartbeatDetected(parsedData.Heartbeat);
                                    console.log('Extracted JSON:', parsedData);
                                } catch (error) {
                                    console.error('Failed to parse JSON:', error);
                                }
                            }
                        });

                        // Update buffer with any remaining data that wasn't fully parsed
                        const remainingData = jsonObjects[jsonObjects.length - 1].includes('{')
                            ? jsonObjects[jsonObjects.length - 1]
                            : '';
                        setIncomingData(remainingData);
                    }
                } catch (error) {
                    console.error('Error reading from serial port:', error);
                }
            }
        };

        if (reader) {
            readSerialData();
        }
    }, [reader, incomingData]);

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
